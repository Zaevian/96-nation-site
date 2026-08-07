import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { flushEmailOutbox } from "@/lib/email/outbox";
import {
  enqueueAndFlushOrderConfirmation,
  expirePendingOrder,
  findOrderByCheckoutSession,
  findOrderById,
  findOrderByPaymentIntent,
  fulfillPendingOrder,
  markOrderPartiallyRefunded,
  refundPaidOrder,
} from "@/lib/orders/fulfill";
import { captureException } from "@/lib/sentry";
import { getStripe } from "@/lib/stripe";
import { createServiceClientOrNull } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookEventRow = {
  id: string;
  type: string;
  status: "processing" | "processed" | "failed";
  attempts: number;
  last_error: string | null;
  order_id: string | null;
  processed_at: string | null;
};

/**
 * POST /api/stripe/webhook
 * Appendix C two-phase stripe_webhook_events:
 * claim processing → handle → processed | failed (5xx so Stripe retries).
 * Short-circuit ONLY when status === 'processed'.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const supabase = createServiceClientOrNull();

  if (!stripe || !webhookSecret) {
    console.error("[stripe/webhook] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("webhook not configured", { status: 503 });
  }
  if (!supabase) {
    console.error("[stripe/webhook] missing Supabase service role");
    return new Response("database not configured", { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] invalid signature:", err);
    return new Response("invalid signature", { status: 400 });
  }

  // Claim or re-enter event row. Short-circuit ONLY if fully processed.
  const existing = await findWebhookEvent(supabase, event.id);
  if (existing?.status === "processed") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!existing) {
    const { error } = await supabase.from("stripe_webhook_events").insert({
      id: event.id,
      type: event.type,
      status: "processing",
      attempts: 1,
    });
    if (error) {
      // Concurrent insert race — re-read
      const raced = await findWebhookEvent(supabase, event.id);
      if (raced?.status === "processed") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      if (!raced) {
        console.error("[stripe/webhook] insert event failed:", error.message);
        return new Response("handler error", { status: 500 });
      }
      await supabase
        .from("stripe_webhook_events")
        .update({
          status: "processing",
          attempts: (raced.attempts ?? 0) + 1,
          last_error: null,
        })
        .eq("id", event.id);
    }
  } else {
    // processing | failed → Stripe retry; bump attempts
    await supabase
      .from("stripe_webhook_events")
      .update({
        status: "processing",
        attempts: (existing.attempts ?? 0) + 1,
        last_error: null,
      })
      .eq("id", event.id);
  }

  try {
    let skipNote: string | null = null;

    switch (event.type) {
      case "checkout.session.completed": {
        skipNote = await handleCheckoutCompleted(
          supabase,
          event.data.object as Stripe.Checkout.Session,
          event.id,
        );
        break;
      }
      case "checkout.session.expired": {
        await handleCheckoutExpired(
          supabase,
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }
      case "charge.refunded": {
        await handleChargeRefunded(
          supabase,
          event.data.object as Stripe.Charge,
        );
        break;
      }
      default:
        // Acknowledge unhandled types so Stripe stops retrying
        break;
    }

    await supabase
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        last_error: skipNote,
      })
      .eq("id", event.id);

    if (skipNote) {
      return NextResponse.json({ received: true, skipped: true });
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] handler error:", message, err);
    await captureException(err, {
      stripeEventId: event.id,
      stripeEventType: event.type,
    });

    await supabase
      .from("stripe_webhook_events")
      .update({
        status: "failed",
        last_error: message.slice(0, 2000),
      })
      .eq("id", event.id);

    // Non-2xx so Stripe retries; row is NOT "processed"
    return new Response("handler error", { status: 500 });
  }
}

async function findWebhookEvent(
  client: SupabaseClient,
  id: string,
): Promise<WebhookEventRow | null> {
  const { data, error } = await client
    .from("stripe_webhook_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[stripe/webhook] find event:", error.message);
    throw new Error(`webhook event lookup failed: ${error.message}`);
  }
  return (data as WebhookEventRow | null) ?? null;
}

async function handleCheckoutCompleted(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<string | null> {
  // Card Checkout v1: only fulfill successful payment.
  // (no_payment_required is free-path territory — we do not use Stripe for free.)
  if (session.payment_status !== "paid") {
    // Leave order pending for reconcile if this was unexpected
    return `skip payment_status=${session.payment_status}`;
  }

  const orderId =
    session.metadata?.orderId ||
    (await resolveOrderIdFromSession(client, session));

  if (!orderId) {
    throw new Error(
      `checkout.session.completed ${session.id}: no orderId in metadata`,
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const before = await findOrderById(client, orderId);
  const order = await fulfillPendingOrder(client, {
    orderId,
    stripePaymentIntentId: paymentIntentId,
    stripeCheckoutSessionId: session.id,
  });

  await client
    .from("stripe_webhook_events")
    .update({ order_id: order.id })
    .eq("id", eventId);

  // Enqueue confirmation (unique dedupe_key prevents double send on retries)
  if (
    order.status === "paid" ||
    order.status === "fulfilled" ||
    before?.status === "pending"
  ) {
    const eventTitle = await resolveEventTitle(order.event_slug);
    await enqueueAndFlushOrderConfirmation(
      client,
      order,
      eventTitle,
      session.id,
    );
    await flushEmailOutbox(client, `order_confirm:${order.id}`).catch(() => {});
  }

  return null;
}

async function resolveOrderIdFromSession(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  if (session.metadata?.orderId) return session.metadata.orderId;
  const bySession = await findOrderByCheckoutSession(client, session.id);
  return bySession?.id ?? null;
}

async function handleCheckoutExpired(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  let orderId = session.metadata?.orderId ?? null;
  if (!orderId) {
    const bySession = await findOrderByCheckoutSession(client, session.id);
    orderId = bySession?.id ?? null;
  }
  if (!orderId) {
    console.warn(
      "[stripe/webhook] session.expired: no order for session",
      session.id,
    );
    return;
  }
  await expirePendingOrder(client, orderId);
}

async function handleChargeRefunded(
  client: SupabaseClient,
  charge: Stripe.Charge,
): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    console.warn("[stripe/webhook] charge.refunded without payment_intent");
    return;
  }

  const order = await findOrderByPaymentIntent(client, paymentIntentId);
  if (!order) {
    // May be a non-ticketing charge or not yet attached PI
    console.warn(
      "[stripe/webhook] charge.refunded: no order for PI",
      paymentIntentId,
    );
    return;
  }

  // Only paid/fulfilled/partially_refunded hold sold capacity.
  if (
    order.status !== "paid" &&
    order.status !== "fulfilled" &&
    order.status !== "partially_refunded" &&
    order.status !== "refunded"
  ) {
    console.warn(
      "[stripe/webhook] charge.refunded: order not in refundable status",
      order.id,
      order.status,
    );
    return;
  }

  const amountRefunded = charge.amount_refunded ?? 0;
  const amount = charge.amount ?? 0;
  const fullyRefunded =
    charge.refunded === true || (amount > 0 && amountRefunded >= amount);

  if (fullyRefunded) {
    await refundPaidOrder(
      client,
      order.id,
      `Full refund via Stripe charge ${charge.id}`,
    );
  } else {
    await markOrderPartiallyRefunded(
      client,
      order.id,
      `Partial refund via Stripe charge ${charge.id}: ${amountRefunded}/${amount}`,
    );
  }
}

async function resolveEventTitle(eventSlug: string): Promise<string> {
  try {
    const { getEventBySlug } = await import("@/lib/sanity/queries");
    const event = await getEventBySlug(eventSlug);
    if (event?.title) return event.title;
  } catch {
    // fall through
  }
  return eventSlug || "Event";
}
