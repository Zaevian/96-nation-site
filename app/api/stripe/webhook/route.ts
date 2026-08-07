import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { flushEmailOutbox } from "@/lib/email/outbox";
import {
  enqueueAndFlushOrderConfirmation,
  findOrderByCheckoutSession,
  findOrderById,
  findOrderByPaymentIntent,
  fulfillPendingOrder,
  markOrderPartiallyRefunded,
  refundPaidOrder,
} from "@/lib/orders/fulfill";
import { expireOrFulfillPendingOrder } from "@/lib/orders/stripe-expire";
import { captureException, captureMessage } from "@/lib/sentry";
import { getStripe } from "@/lib/stripe";
import { createServiceClientOrNull } from "@/lib/supabase/server";

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
 * CAS: only processing→processed / processing→failed (never clobber processed).
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const supabase = createServiceClientOrNull();

  if (!stripe || !webhookSecret) {
    console.error(
      "[stripe/webhook] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET",
    );
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
  const claim = await claimWebhookEvent(supabase, event);
  if (claim === "duplicate") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (claim === "error") {
    return new Response("handler error", { status: 500 });
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

    // CAS: only processing → processed (O-1)
    const marked = await markWebhookStatus(supabase, event.id, {
      status: "processed",
      processed_at: new Date().toISOString(),
      last_error: skipNote,
    });

    if (!marked) {
      // Another worker already finalized — still success for Stripe
      return NextResponse.json({ received: true, duplicate: true });
    }

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

    // CAS: only processing → failed; never overwrite processed (O-1)
    const markedFailed = await markWebhookStatus(supabase, event.id, {
      status: "failed",
      last_error: message.slice(0, 2000),
    });

    if (!markedFailed) {
      const row = await findWebhookEvent(supabase, event.id);
      if (row?.status === "processed") {
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    // Non-2xx so Stripe retries; row is NOT "processed"
    return new Response("handler error", { status: 500 });
  }
}

/**
 * Insert as processing, or re-claim failed/processing with attempts bump.
 * Returns "duplicate" if already processed; "error" on hard failure; "ok" to handle.
 */
async function claimWebhookEvent(
  client: SupabaseClient,
  event: Stripe.Event,
): Promise<"ok" | "duplicate" | "error"> {
  const existing = await findWebhookEvent(client, event.id);
  if (existing?.status === "processed") {
    return "duplicate";
  }

  if (!existing) {
    const { error } = await client.from("stripe_webhook_events").insert({
      id: event.id,
      type: event.type,
      status: "processing",
      attempts: 1,
    });
    if (error) {
      // Concurrent insert race — re-read / re-claim
      const raced = await findWebhookEvent(client, event.id);
      if (raced?.status === "processed") {
        return "duplicate";
      }
      if (!raced) {
        console.error("[stripe/webhook] insert event failed:", error.message);
        return "error";
      }
      const claimed = await reclaimWebhookEvent(client, raced);
      return claimed;
    }
    return "ok";
  }

  return reclaimWebhookEvent(client, existing);
}

async function reclaimWebhookEvent(
  client: SupabaseClient,
  existing: WebhookEventRow,
): Promise<"ok" | "duplicate" | "error"> {
  // Only re-enter failed | processing — never touch processed
  const { data, error } = await client
    .from("stripe_webhook_events")
    .update({
      status: "processing",
      attempts: (existing.attempts ?? 0) + 1,
      last_error: null,
    })
    .eq("id", existing.id)
    .in("status", ["failed", "processing"])
    .select("id");

  if (error) {
    console.error("[stripe/webhook] reclaim failed:", error.message);
    return "error";
  }
  if (!data?.length) {
    const again = await findWebhookEvent(client, existing.id);
    if (again?.status === "processed") {
      return "duplicate";
    }
    // Lost claim race with concurrent processing — still proceed; order guards hold
    return "ok";
  }
  return "ok";
}

/** CAS update: only from status=processing. Returns false if 0 rows matched. */
async function markWebhookStatus(
  client: SupabaseClient,
  id: string,
  patch: {
    status: "processed" | "failed";
    processed_at?: string;
    last_error?: string | null;
  },
): Promise<boolean> {
  const { data, error } = await client
    .from("stripe_webhook_events")
    .update({
      status: patch.status,
      processed_at: patch.processed_at ?? null,
      last_error: patch.last_error ?? null,
    })
    .eq("id", id)
    .eq("status", "processing")
    .select("id");

  if (error) {
    console.error("[stripe/webhook] mark status failed:", error.message);
    return false;
  }
  return Boolean(data?.length);
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
  if (session.payment_status !== "paid") {
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

  // Fulfill pending OR resurrect expired (O-3)
  const order = await fulfillPendingOrder(client, {
    orderId,
    stripePaymentIntentId: paymentIntentId,
    stripeCheckoutSessionId: session.id,
  });

  await client
    .from("stripe_webhook_events")
    .update({ order_id: order.id })
    .eq("id", eventId);

  if (
    order.status !== "paid" &&
    order.status !== "fulfilled" &&
    before &&
    before.status !== "paid" &&
    before.status !== "fulfilled"
  ) {
    // Unexpected: paid session but order not paid (e.g. failed/cancelled)
    await captureMessage(
      "webhook: paid session but order not paid after fulfill",
      "error",
      {
        orderId,
        orderStatus: order.status,
        beforeStatus: before.status,
        sessionId: session.id,
      },
    );
    throw new Error(
      `fulfill left order ${orderId} in status ${order.status} despite paid session`,
    );
  }

  // Email only on real transition into paid (O-8)
  const transitioned =
    before &&
    (before.status === "pending" || before.status === "expired") &&
    (order.status === "paid" || order.status === "fulfilled");

  if (transitioned) {
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

  const order = await findOrderById(client, orderId);
  if (!order) return;

  // O-3: if somehow paid, fulfill instead of expire
  await expireOrFulfillPendingOrder(client, order, { session });
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
    console.warn(
      "[stripe/webhook] charge.refunded: no order for PI",
      paymentIntentId,
    );
    return;
  }

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
