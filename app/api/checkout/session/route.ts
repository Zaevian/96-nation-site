import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  attachStripeSessionId,
  createPendingOrderWithReserve,
  failPendingOrderAndRelease,
  findOrderByIdempotencyKey,
  isInventoryMissing,
  isInventorySoldOut,
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
 * Tx1 reserve+insert pending → Stripe outside DB → Tx2 set session id or fail+release.
 */
export async function POST(request: Request) {
  if (!isTicketingEnabled()) {
    return jsonError(503, "Ticketing is temporarily disabled", "TICKETING_DISABLED");
  }

  const ip = getClientIp(request);
  const rl = await rateLimitCheckout(ip);
  if (!rl.success) {
    return jsonError(429, "Too many checkout attempts. Try again later.", "RATE_LIMITED");
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
      "This ticket is free — use POST /api/checkout/rsvp",
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

  // Idempotency: reuse pending session URL when present.
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
    if (
      existing.status === "pending" &&
      existing.stripe_checkout_session_id
    ) {
      const stripe = getStripe();
      if (!stripe) {
        return jsonError(503, "Stripe not configured", "NOT_CONFIGURED");
      }
      try {
        const session = await stripe.checkout.sessions.retrieve(
          existing.stripe_checkout_session_id,
        );
        if (session.url) {
          return NextResponse.json({
            url: session.url,
            orderId: existing.id,
            replayed: true,
          });
        }
      } catch (err) {
        console.error("[checkout/session] retrieve existing session:", err);
      }
      // Fall through to recreate if session URL missing
    }

    if (existing.status === "pending" && !existing.stripe_checkout_session_id) {
      // Retry Stripe create with same Idempotency-Key (order already reserved).
      return await createStripeAndAttach(existing, event.title, ticket.name);
    }

    // Terminal or non-replayable
    return jsonError(
      409,
      `Order already exists with status ${existing.status}`,
      "CONFLICT",
      { orderId: existing.id },
    );
  }

  // Tx1: reserve + insert pending (no session id)
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
        "Inventory not synced for this ticket — try again later",
        "INVENTORY_MISSING",
      );
    }
    // Unique violation on idempotency_key (race)
    const msg = err instanceof Error ? err.message : String(err);
    if (/duplicate|unique|idempotency/i.test(msg)) {
      const again = await findOrderByIdempotencyKey(
        supabase,
        input.idempotencyKey,
      );
      if (again?.stripe_checkout_session_id) {
        const stripe = getStripe();
        if (stripe) {
          try {
            const session = await stripe.checkout.sessions.retrieve(
              again.stripe_checkout_session_id,
            );
            if (session.url) {
              return NextResponse.json({
                url: session.url,
                orderId: again.id,
                replayed: true,
              });
            }
          } catch {
            // continue
          }
        }
      }
      if (again?.status === "pending") {
        return await createStripeAndAttach(again, event.title, ticket.name);
      }
    }
    console.error("[checkout/session] Tx1 failed:", err);
    return jsonError(500, "Could not reserve tickets", "INTERNAL");
  }

  return await createStripeAndAttach(order, event.title, ticket.name);
}

async function createStripeAndAttach(
  order: OrderRow,
  eventTitle: string,
  ticketName: string,
) {
  const supabase = createServiceClientOrNull();
  const stripe = getStripe();
  if (!supabase || !stripe) {
    return jsonError(503, "Service not configured", "NOT_CONFIGURED");
  }

  const facilityFee = order.facility_fee_cents ?? getFacilityFeeCents();
  const siteUrl = getSiteUrl();

  // Align Stripe expires_at with reservation when possible (min 30m from now).
  const expiresAt = order.reservation_expires_at
    ? Math.floor(new Date(order.reservation_expires_at).getTime() / 1000)
    : Math.floor(reservationExpiresAt().getTime() / 1000);
  const minExpires = Math.floor(Date.now() / 1000) + 30 * 60;
  const stripeExpires = Math.max(expiresAt, minExpires);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: order.quantity,
      price_data: {
        currency: order.currency || "usd",
        unit_amount: order.unit_price_cents,
        product_data: {
          name: `${eventTitle} — ${ticketName}`,
        },
      },
    },
  ];

  // Facility fee line when price > 0 and FACILITY_FEE_CENTS > 0
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
        idempotencyKey: order.idempotency_key,
      },
    );
  } catch (err) {
    console.error("[checkout/session] Stripe create failed:", err);
    await failPendingOrderAndRelease(supabase, order);
    return jsonError(
      502,
      "Payment provider error — reservation released; please retry",
      "STRIPE_ERROR",
    );
  }

  if (!session.url || !session.id) {
    await failPendingOrderAndRelease(supabase, order);
    return jsonError(
      502,
      "Payment provider returned no checkout URL",
      "STRIPE_ERROR",
    );
  }

  // Tx2: set stripe_checkout_session_id
  try {
    await attachStripeSessionId(supabase, order.id, session.id);
  } catch (err) {
    console.error("[checkout/session] Tx2 attach failed:", err);
    // Session exists in Stripe; do not release inventory — reconcile can attach.
    // Still return URL so buyer can pay.
  }

  return NextResponse.json({
    url: session.url,
    orderId: order.id,
  });
}
