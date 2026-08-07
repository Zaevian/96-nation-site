import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { OrderRow } from "@/lib/checkout/orders";
import {
  enqueueAndFlushOrderConfirmation,
  expirePendingOrder,
  findOrderById,
  fulfillPendingOrder,
} from "@/lib/orders/fulfill";
import { captureMessage } from "@/lib/sentry";
import { getStripe } from "@/lib/stripe";

export type ExpireOrFulfillResult = {
  action: "expired" | "fulfilled" | "skipped" | "already_terminal";
  order: OrderRow | null;
};

/**
 * Before expiring a pending reservation, check Stripe if session id present.
 * If payment_status === 'paid', fulfill (or resurrect) instead of expire (O-3).
 */
export async function expireOrFulfillPendingOrder(
  client: SupabaseClient,
  order: Pick<
    OrderRow,
    | "id"
    | "status"
    | "stripe_checkout_session_id"
    | "event_slug"
    | "event_id"
    | "ticket_type_id"
    | "quantity"
  >,
  options?: {
    /** Pre-fetched session (e.g. from webhook event payload). */
    session?: Stripe.Checkout.Session | null;
  },
): Promise<ExpireOrFulfillResult> {
  if (order.status !== "pending" && order.status !== "expired") {
    const current = await findOrderById(client, order.id);
    return { action: "already_terminal", order: current };
  }

  let session = options?.session ?? null;
  const sessionId =
    session?.id ?? order.stripe_checkout_session_id ?? null;

  if (sessionId && !session) {
    const stripe = getStripe();
    if (stripe) {
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (err) {
        console.warn(
          "[orders] Stripe retrieve before expire failed; will expire if pending:",
          order.id,
          err,
        );
      }
    }
  }

  if (session && session.payment_status === "paid") {
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const updated = await fulfillPendingOrder(client, {
      orderId: order.id,
      stripePaymentIntentId: paymentIntentId,
      stripeCheckoutSessionId: session.id,
    });

    if (updated.status === "paid" || updated.status === "fulfilled") {
      await captureMessage(
        "expire-or-fulfill: paid Stripe session fulfilled instead of expire",
        "warning",
        {
          orderId: order.id,
          sessionId: session.id,
          previousStatus: order.status,
        },
      );

      try {
        const { getEventBySlug } = await import("@/lib/sanity/queries");
        const event = await getEventBySlug(updated.event_slug);
        await enqueueAndFlushOrderConfirmation(
          client,
          updated,
          event?.title || updated.event_slug,
          session.id,
        );
      } catch (emailErr) {
        console.error("[orders] confirm email after fulfill-not-expire:", emailErr);
      }

      return { action: "fulfilled", order: updated };
    }
  }

  // Not paid (or no session): expire pending only
  if (order.status === "pending") {
    const expired = await expirePendingOrder(client, order.id);
    return {
      action: expired?.status === "expired" ? "expired" : "skipped",
      order: expired,
    };
  }

  // Already expired and not paid — nothing to do
  const current = await findOrderById(client, order.id);
  return { action: "skipped", order: current };
}
