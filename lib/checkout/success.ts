import "server-only";

import { createHash, timingSafeEqual } from "crypto";

import type { OrderRow } from "@/lib/checkout/orders";
import { hashConfirmToken } from "@/lib/checkout/orders";
import {
  findOrderByCheckoutSession,
  findOrderById,
} from "@/lib/orders/fulfill";
import { getStripe } from "@/lib/stripe";
import { createServiceClientOrNull } from "@/lib/supabase/server";

export type SuccessView =
  | {
      kind: "confirmed";
      orderId: string;
      eventTitle: string;
      quantity: number;
      status: string;
      maskedEmail: string | null;
      processing: boolean;
    }
  | {
      kind: "processing";
      orderId: string | null;
      message: string;
    }
  | {
      kind: "unauthorized";
      message: string;
    }
  | {
      kind: "empty";
      message: string;
    };

export function maskEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}***@${domain}`;
}

function safeEqualHash(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

async function resolveEventTitle(slug: string): Promise<string> {
  try {
    const { getEventBySlug } = await import("@/lib/sanity/queries");
    const event = await getEventBySlug(slug);
    if (event?.title) return event.title;
  } catch {
    // ignore
  }
  return slug || "Event";
}

function toConfirmed(
  order: OrderRow,
  eventTitle: string,
  processing: boolean,
): SuccessView {
  return {
    kind: "confirmed",
    orderId: order.id,
    eventTitle,
    quantity: order.quantity,
    status: order.status,
    // Minimal PII: masked email only; never phone
    maskedEmail: maskEmail(order.buyer_email),
    processing,
  };
}

/**
 * Resolve success page data with authz:
 * - Paid: must retrieve Stripe session; load order via metadata.orderId
 * - Free: order_id + confirm token hash match
 */
export async function resolveSuccessView(params: {
  sessionId?: string;
  orderId?: string;
  token?: string;
}): Promise<SuccessView> {
  const sessionId = params.sessionId?.trim();
  const orderId = params.orderId?.trim();
  const token = params.token?.trim();

  if (!sessionId && !orderId) {
    return {
      kind: "empty",
      message:
        "If you just completed checkout or an RSVP, check your email for confirmation. This page does not show order details without a valid session or token.",
    };
  }

  const supabase = createServiceClientOrNull();
  if (!supabase) {
    return {
      kind: "unauthorized",
      message:
        "Order lookup is temporarily unavailable. Check your email for confirmation.",
    };
  }

  // --- Paid path: Stripe session verification required ---
  if (sessionId) {
    const stripe = getStripe();
    if (!stripe) {
      return {
        kind: "unauthorized",
        message:
          "Payment verification is temporarily unavailable. Check your email for confirmation.",
      };
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return {
        kind: "unauthorized",
        message:
          "We could not verify this payment session. Check your email for confirmation or contact support with your receipt.",
      };
    }

    if (session.mode && session.mode !== "payment") {
      return {
        kind: "unauthorized",
        message: "Invalid checkout session.",
      };
    }

    const metaOrderId = session.metadata?.orderId;
    let order: OrderRow | null = null;

    if (metaOrderId) {
      order = await findOrderById(supabase, metaOrderId);
    }
    if (!order) {
      order = await findOrderByCheckoutSession(supabase, session.id);
    }

    if (!order) {
      if (session.payment_status === "paid") {
        return {
          kind: "processing",
          orderId: metaOrderId ?? null,
          message:
            "Payment received. Your order is still processing — refresh in a moment or check your email.",
        };
      }
      return {
        kind: "unauthorized",
        message:
          "We could not find an order for this session. Check your email for confirmation.",
      };
    }

    // Only expose order after Stripe confirms the session is linked
    if (
      order.stripe_checkout_session_id &&
      order.stripe_checkout_session_id !== session.id
    ) {
      return {
        kind: "unauthorized",
        message: "Session does not match this order.",
      };
    }

    const eventTitle = await resolveEventTitle(order.event_slug);
    const processing =
      order.status === "pending" && session.payment_status === "paid";

    return toConfirmed(order, eventTitle, processing);
  }

  // --- Free path: order_id + unguessable confirm token ---
  if (orderId && token) {
    const order = await findOrderById(supabase, orderId);
    if (!order || !order.confirm_token_hash) {
      return {
        kind: "unauthorized",
        message:
          "Invalid or expired confirmation link. Check your email for the correct link.",
      };
    }

    const tokenHash = hashConfirmToken(token);
    if (!safeEqualHash(tokenHash, order.confirm_token_hash)) {
      return {
        kind: "unauthorized",
        message:
          "Invalid confirmation token. Use the link from your email.",
      };
    }

    const eventTitle = await resolveEventTitle(order.event_slug);
    return toConfirmed(order, eventTitle, false);
  }

  // order_id without token — do not leak PII
  if (orderId) {
    return {
      kind: "unauthorized",
      message:
        "A confirmation token is required to view this order. Open the link from your email.",
    };
  }

  return {
    kind: "empty",
    message:
      "If you just completed checkout, check your email for confirmation.",
  };
}

/** Unused helper kept for potential HMAC variants. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
