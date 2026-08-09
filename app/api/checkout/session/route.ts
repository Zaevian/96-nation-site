import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  attachStripeSessionId,
  clearOrderStripeSession,
  createPendingOrderWithReserve,
  extendOrderReservation,
  failPendingOrderAndRelease,
  findOrderByIdempotencyKey,
  isInventoryMissing,
  isInventorySoldOut,
  isReservationExpired,
  reactivateFailedOrderWithReserve,
  reservationExpiresAt,
  type OrderRow,
} from "@/lib/checkout/orders";
import {
  maxQuantityForTicket,
  resolveCheckoutEvent,
} from "@/lib/checkout/event";
import {
  getFacilityFeeCents,
  getSiteUrl,
  isTicketingEnabled,
  RESERVATION_TTL_MINUTES,
} from "@/lib/env/ticketing";
import { getClientIp, rateLimitCheckout } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createServiceClientOrNull } from "@/lib/supabase/server";
import {
  checkoutBodySchema,
  type CheckoutErrorCode,
} from "@/lib/validations/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(
  status: number,
  error: string,
  code: CheckoutErrorCode,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, code, ...extra }, { status });
}

/**
 * POST /api/checkout/session — paid checkout only (unit price > 0).
 * Atomic Tx1 RPC → Stripe outside DB → Tx2 set session id or fail+release RPC.
 */
export async function POST(request: Request) {
  if (!isTicketingEnabled()) {
    return jsonError(
      503,
      "Ticketing is temporarily disabled",
      "TICKETING_DISABLED",
    );
  }

  const ip = getClientIp(request);
  const rl = await rateLimitCheckout(ip);
  if (!rl.success) {
    return jsonError(
      429,
      "Too many checkout attempts. Try again later.",
      "RATE_LIMITED",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body", "VALIDATION");
  }

  const parsed = checkoutBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Validation failed", "VALIDATION", {
      details: parsed.error.flatten(),
    });
  }

  const input = parsed.data;

  if (!isStripeConfigured()) {
    return jsonError(
      503,
      "Payments are not configured (missing STRIPE_SECRET_KEY)",
      "NOT_CONFIGURED",
    );
  }

  const supabase = createServiceClientOrNull();
  if (!supabase) {
    return jsonError(
      503,
      "Ticketing database is not configured (missing Supabase service role)",
      "NOT_CONFIGURED",
    );
  }

  const resolved = await resolveCheckoutEvent(
    input.eventSlug,
    input.ticketTypeId,
  );
  if (!resolved.ok) {
    const map: Record<string, { status: number; code: CheckoutErrorCode }> = {
      NOT_FOUND: { status: 404, code: "NOT_FOUND" },
      CANCELLED: { status: 400, code: "CANCELLED" },
      TICKET_NOT_FOUND: { status: 400, code: "VALIDATION" },
      NOT_ON_SALE: { status: 400, code: "NOT_ON_SALE" },
    };
    const m = map[resolved.error.code] ?? {
      status: 400,
      code: "VALIDATION" as CheckoutErrorCode,
    };
    return jsonError(m.status, resolved.error.message, m.code);
  }

  const { event, ticket } = resolved.data;
  const unitPrice = ticket.priceCents ?? 0;

  if (unitPrice === 0) {
    return jsonError(
      400,
      "This ticket is free. Use POST /api/checkout/rsvp",
      "FREE_EVENT_USE_RSVP",
    );
  }

  const maxQty = maxQuantityForTicket(ticket);
  if (input.quantity > maxQty) {
    return jsonError(
      400,
      `Quantity must be between 1 and ${maxQty}`,
      "VALIDATION",
    );
  }

  let existing: OrderRow | null = null;
  try {
    existing = await findOrderByIdempotencyKey(
      supabase,
      input.idempotencyKey,
    );
  } catch (err) {
    console.error("[checkout/session] idempotency lookup:", err);
    return jsonError(500, "Database error", "INTERNAL");
  }

  if (existing) {
    // --- failed: allow same-key retry via reactivate + new Stripe session ---
    if (existing.status === "failed") {
      try {
        const reactivated = await reactivateFailedOrderWithReserve(
          supabase,
          input.idempotencyKey,
        );
        return await createStripeAndAttach(
          reactivated,
          event.title,
          ticket.name,
          { stripeIdempotencySuffix: "reactivate" },
        );
      } catch (err) {
        if (isInventorySoldOut(err)) {
          return jsonError(409, "Not enough tickets remaining", "SOLD_OUT");
        }
        if (isInventoryMissing(err)) {
          return jsonError(
            503,
            "Inventory not synced for this ticket. Try again later.",
            "INVENTORY_MISSING",
          );
        }
        console.error("[checkout/session] reactivate failed order:", err);
        return jsonError(
          500,
          "Could not retry failed checkout. Try again with a fresh form.",
          "INTERNAL",
          { retryWithNewKey: true },
        );
      }
    }

    // --- pending + live Stripe URL → replay ---
    if (existing.status === "pending") {
      if (isReservationExpired(existing)) {
        try {
          await failPendingOrderAndRelease(supabase, existing);
        } catch (err) {
          console.error(
            "[checkout/session] fail expired reservation:",
            err,
          );
        }
        return jsonError(
          410,
          "Reservation expired. Please start checkout again.",
          "RESERVATION_EXPIRED",
          { retryWithNewKey: true },
        );
      }

      if (existing.stripe_checkout_session_id) {
        const stripe = getStripe();
        if (!stripe) {
          return jsonError(503, "Stripe not configured", "NOT_CONFIGURED");
        }
        try {
          const session = await stripe.checkout.sessions.retrieve(
            existing.stripe_checkout_session_id,
          );
          // Live open session with URL → safe replay
          if (
            session.url &&
            session.status !== "expired" &&
            !sessionIsPastExpiry(session)
          ) {
            return NextResponse.json({
              url: session.url,
              orderId: existing.id,
              replayed: true,
            });
          }
        } catch (err) {
          console.error(
            "[checkout/session] retrieve existing session:",
            err,
          );
        }

        // Pending + session id but no usable URL: clear and recreate Stripe session
        const previousSessionId = existing.stripe_checkout_session_id;
        try {
          existing = await clearOrderStripeSession(supabase, existing.id);
        } catch (err) {
          console.error("[checkout/session] clear session id:", err);
          return jsonError(
            500,
            "Could not recover checkout session. Please retry.",
            "INTERNAL",
            { retryWithNewKey: true },
          );
        }
        return await createStripeAndAttach(
          existing,
          event.title,
          ticket.name,
          {
            stripeIdempotencySuffix: `recreate:${previousSessionId}`,
          },
        );
      }

      // pending + no session id → create Stripe (retry after process death between Tx1/Tx2)
      return await createStripeAndAttach(existing, event.title, ticket.name);
    }

    // Terminal (paid, fulfilled, expired, cancelled, refunded, …)
    return jsonError(
      409,
      `Order already exists with status ${existing.status}`,
      "CONFLICT",
      { orderId: existing.id, retryWithNewKey: true },
    );
  }

  // Tx1: atomic reserve + insert pending
  let order: OrderRow;
  try {
    order = await createPendingOrderWithReserve(supabase, {
      eventSlug: event.slug,
      eventId: event._id,
      ticketTypeId: ticket.id,
      quantity: input.quantity,
      unitPriceCents: unitPrice,
      buyer: input.buyer,
      marketingOptIn: input.marketingOptIn ?? false,
      idempotencyKey: input.idempotencyKey,
      currency: ticket.currency || "usd",
    });
  } catch (err) {
    if (isInventorySoldOut(err)) {
      return jsonError(409, "Not enough tickets remaining", "SOLD_OUT");
    }
    if (isInventoryMissing(err)) {
      return jsonError(
        503,
        "Inventory not synced for this ticket. Try again later.",
        "INVENTORY_MISSING",
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (/duplicate|unique|idempotency/i.test(msg)) {
      const again = await findOrderByIdempotencyKey(
        supabase,
        input.idempotencyKey,
      );
      if (again) {
        // Race: re-enter idempotent branches by recursive-style handling
        if (again.status === "failed") {
          try {
            const reactivated = await reactivateFailedOrderWithReserve(
              supabase,
              input.idempotencyKey,
            );
            return await createStripeAndAttach(
              reactivated,
              event.title,
              ticket.name,
              { stripeIdempotencySuffix: "reactivate" },
            );
          } catch (reactivateErr) {
            console.error(
              "[checkout/session] race reactivate:",
              reactivateErr,
            );
          }
        }
        if (again.status === "pending") {
          if (again.stripe_checkout_session_id) {
            const stripe = getStripe();
            if (stripe) {
              try {
                const session = await stripe.checkout.sessions.retrieve(
                  again.stripe_checkout_session_id,
                );
                if (session.url && session.status !== "expired") {
                  return NextResponse.json({
                    url: session.url,
                    orderId: again.id,
                    replayed: true,
                  });
                }
              } catch {
                // fall through
              }
            }
          }
          return await createStripeAndAttach(again, event.title, ticket.name);
        }
      }
    }
    console.error("[checkout/session] Tx1 failed:", err);
    return jsonError(500, "Could not reserve tickets", "INTERNAL");
  }

  return await createStripeAndAttach(order, event.title, ticket.name);
}

function sessionIsPastExpiry(session: Stripe.Checkout.Session): boolean {
  if (!session.expires_at) return false;
  return session.expires_at * 1000 < Date.now();
}

type StripeCreateOptions = {
  /** Extra suffix so Stripe Idempotency-Key differs when recreating sessions. */
  stripeIdempotencySuffix?: string;
};

async function createStripeAndAttach(
  order: OrderRow,
  eventTitle: string,
  ticketName: string,
  options: StripeCreateOptions = {},
) {
  const supabase = createServiceClientOrNull();
  const stripe = getStripe();
  if (!supabase || !stripe) {
    return jsonError(503, "Service not configured", "NOT_CONFIGURED");
  }

  // Already-expired reservation: fail closed, ask client for new key
  if (isReservationExpired(order)) {
    try {
      await failPendingOrderAndRelease(supabase, order);
    } catch (err) {
      console.error("[checkout/session] fail expired in createStripe:", err);
    }
    return jsonError(
      410,
      "Reservation expired. Please start checkout again.",
      "RESERVATION_EXPIRED",
      { retryWithNewKey: true },
    );
  }

  const facilityFee = order.facility_fee_cents ?? getFacilityFeeCents();
  const siteUrl = getSiteUrl();

  // Stripe requires expires_at >= now + 30 minutes.
  // Keep order.reservation_expires_at aligned: extend TTL when needed so
  // session never outlives the DB hold.
  const nowSec = Math.floor(Date.now() / 1000);
  const stripeMinExpires = nowSec + 30 * 60;
  let stripeExpires = order.reservation_expires_at
    ? Math.floor(new Date(order.reservation_expires_at).getTime() / 1000)
    : Math.floor(reservationExpiresAt().getTime() / 1000);

  if (stripeExpires < stripeMinExpires) {
    stripeExpires = stripeMinExpires;
    const extended = new Date(stripeExpires * 1000);
    try {
      order = await extendOrderReservation(supabase, order.id, extended);
    } catch (err) {
      console.error("[checkout/session] extend reservation TTL:", err);
      return jsonError(
        500,
        "Could not align reservation with payment session",
        "INTERNAL",
      );
    }
  }

  // Cap at reservation TTL max from now (safety); prefer synced value
  const maxExpires = nowSec + RESERVATION_TTL_MINUTES * 60;
  if (stripeExpires > maxExpires && order.reservation_expires_at) {
    // Already extended above only when below min; leave as-is if longer
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: order.quantity,
      price_data: {
        currency: order.currency || "usd",
        unit_amount: order.unit_price_cents,
        product_data: {
          name: `${eventTitle}: ${ticketName}`,
        },
      },
    },
  ];

  if (order.unit_price_cents > 0 && facilityFee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: order.currency || "usd",
        unit_amount: facilityFee,
        product_data: {
          name: "Facility fee",
        },
      },
    });
  }

  const stripeIdempotencyKey = options.stripeIdempotencySuffix
    ? `${order.idempotency_key}:${options.stripeIdempotencySuffix}`
    : order.idempotency_key;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order.buyer_email,
        line_items: lineItems,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout/cancel`,
        expires_at: stripeExpires,
        metadata: {
          orderId: order.id,
          eventId: order.event_id,
          ticketTypeId: order.ticket_type_id,
        },
        payment_intent_data: {
          metadata: {
            orderId: order.id,
          },
        },
      },
      {
        idempotencyKey: stripeIdempotencyKey,
      },
    );
  } catch (err) {
    console.error("[checkout/session] Stripe create failed:", err);
    try {
      await failPendingOrderAndRelease(supabase, order);
    } catch (failErr) {
      console.error(
        "[checkout/session] CRITICAL: fail_pending_order after Stripe error:",
        failErr,
      );
      return jsonError(
        502,
        "Payment provider error and inventory release failed. Contact support.",
        "STRIPE_ERROR",
        { retryWithNewKey: true, releaseFailed: true },
      );
    }
    return jsonError(
      502,
      "Payment provider error. Reservation released; please retry.",
      "STRIPE_ERROR",
      { retryWithNewKey: true },
    );
  }

  if (!session.url || !session.id) {
    try {
      await failPendingOrderAndRelease(supabase, order);
    } catch (failErr) {
      console.error(
        "[checkout/session] CRITICAL: fail after empty Stripe URL:",
        failErr,
      );
      return jsonError(
        502,
        "Payment provider returned no checkout URL; inventory release failed",
        "STRIPE_ERROR",
        { retryWithNewKey: true, releaseFailed: true },
      );
    }
    return jsonError(
      502,
      "Payment provider returned no checkout URL",
      "STRIPE_ERROR",
      { retryWithNewKey: true },
    );
  }

  // Tx2: set stripe_checkout_session_id
  try {
    await attachStripeSessionId(supabase, order.id, session.id);
  } catch (err) {
    console.error("[checkout/session] Tx2 attach failed:", err);
    // Session exists in Stripe; do not release — return URL for buyer.
  }

  return NextResponse.json({
    url: session.url,
    orderId: order.id,
  });
}
