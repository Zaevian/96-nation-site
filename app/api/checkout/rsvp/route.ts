import { NextResponse } from "next/server";

import {
  createRsvpOrder,
  findOrderByIdempotencyKey,
  isInventoryMissing,
  isInventorySoldOut,
} from "@/lib/checkout/orders";
import {
  maxQuantityForTicket,
  resolveCheckoutEvent,
} from "@/lib/checkout/event";
import { sendRsvpConfirmation } from "@/lib/email/rsvp";
import { isTicketingEnabled } from "@/lib/env/ticketing";
import { getClientIp, rateLimitCheckout } from "@/lib/rate-limit";
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
 * POST /api/checkout/rsvp — free tickets only (priceCents === 0).
 * Reserve + commit sold immediately; order status paid; confirm token + email.
 * No facility fee, no Stripe.
 */
export async function POST(request: Request) {
  if (!isTicketingEnabled()) {
    return jsonError(503, "Ticketing is temporarily disabled", "TICKETING_DISABLED");
  }

  const ip = getClientIp(request);
  const rl = await rateLimitCheckout(ip);
  if (!rl.success) {
    return jsonError(429, "Too many RSVP attempts. Try again later.", "RATE_LIMITED");
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

  if (unitPrice > 0) {
    return jsonError(
      400,
      "This ticket is paid. Use POST /api/checkout/session",
      "PAID_EVENT_USE_SESSION",
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

  // Idempotency replay
  try {
    const existing = await findOrderByIdempotencyKey(
      supabase,
      input.idempotencyKey,
    );
    if (existing) {
      if (
        existing.status === "paid" ||
        existing.status === "fulfilled"
      ) {
        // Token is hashed — cannot re-issue. Email remains source of truth.
        return NextResponse.json({
          orderId: existing.id,
          replayed: true,
          message:
            "RSVP already recorded. Check your email for the confirmation link.",
        });
      }
      return jsonError(
        409,
        `Order already exists with status ${existing.status}`,
        "CONFLICT",
        { orderId: existing.id },
      );
    }
  } catch (err) {
    console.error("[checkout/rsvp] idempotency lookup:", err);
    return jsonError(500, "Database error", "INTERNAL");
  }

  try {
    const { order, confirmToken } = await createRsvpOrder(supabase, {
      eventSlug: event.slug,
      eventId: event._id,
      ticketTypeId: ticket.id,
      quantity: input.quantity,
      buyer: input.buyer,
      marketingOptIn: input.marketingOptIn ?? false,
      idempotencyKey: input.idempotencyKey,
      currency: ticket.currency || "usd",
    });

    // Best-effort confirmation email with success URL (token in link).
    const emailResult = await sendRsvpConfirmation({
      client: supabase,
      orderId: order.id,
      toEmail: order.buyer_email,
      buyerName: order.buyer_name,
      eventTitle: event.title,
      quantity: order.quantity,
      confirmToken,
    });

    return NextResponse.json({
      orderId: order.id,
      confirmToken,
      successUrl: emailResult.successUrl,
      emailSent: emailResult.sent,
    });
  } catch (err) {
    if (isInventorySoldOut(err)) {
      return jsonError(409, "Not enough spots remaining", "SOLD_OUT");
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
      if (again && (again.status === "paid" || again.status === "fulfilled")) {
        return NextResponse.json({
          orderId: again.id,
          replayed: true,
          message:
            "RSVP already recorded. Check your email for the confirmation link.",
        });
      }
    }
    console.error("[checkout/rsvp] create failed:", err);
    return jsonError(500, "Could not complete RSVP", "INTERNAL");
  }
}
