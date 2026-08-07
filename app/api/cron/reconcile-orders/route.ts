import { NextResponse } from "next/server";

import { authorizeCron } from "@/lib/cron/auth";
import {
  enqueueAndFlushOrderConfirmation,
  expirePendingOrder,
  fulfillPendingOrder,
} from "@/lib/orders/fulfill";
import { captureException, captureMessage } from "@/lib/sentry";
import { getStripe } from "@/lib/stripe";
import { createServiceClientOrNull } from "@/lib/supabase/server";
import type { OrderRow } from "@/lib/checkout/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET|POST /api/cron/reconcile-orders
 * Backup for stuck pending orders with a Stripe session older than ~35m:
 * retrieve session → fulfill if paid, expire if expired/unpaid.
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Schedule: every 15 minutes (vercel.json)
 *
 * v1 stub-capable: runs a real reconcile when Stripe + Supabase configured.
 */
async function handle(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClientOrNull();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const cutoff = new Date(Date.now() - 35 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "pending")
    .not("stripe_checkout_session_id", "is", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[cron/reconcile-orders] select failed:", error.message);
    await captureException(error, { cron: "reconcile-orders" });
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  if (!stripe) {
    // Stub mode: report stuck count without mutating when Stripe unset
    return NextResponse.json({
      ok: true,
      stub: true,
      pendingWithSession: rows?.length ?? 0,
      message:
        "STRIPE_SECRET_KEY not set — reconcile skipped (counts only)",
    });
  }

  let fulfilled = 0;
  let expired = 0;
  let paidUnfulfilled = 0;
  const failures: { id: string; error: string }[] = [];

  for (const raw of rows ?? []) {
    const order = raw as OrderRow;
    const sessionId = order.stripe_checkout_session_id;
    if (!sessionId) continue;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const updated = await fulfillPendingOrder(supabase, {
          orderId: order.id,
          stripePaymentIntentId: paymentIntentId,
          stripeCheckoutSessionId: session.id,
        });

        if (updated.status === "paid" || updated.status === "fulfilled") {
          fulfilled += 1;
          if (order.status === "pending") {
            paidUnfulfilled += 1;
            await captureMessage(
              "reconcile: paid Stripe session was still pending",
              "warning",
              { orderId: order.id, sessionId },
            );
            try {
              const { getEventBySlug } = await import("@/lib/sanity/queries");
              const event = await getEventBySlug(order.event_slug);
              await enqueueAndFlushOrderConfirmation(
                supabase,
                updated,
                event?.title || order.event_slug,
                session.id,
              );
            } catch (emailErr) {
              console.error("[cron/reconcile] email:", emailErr);
            }
          }
        }
        continue;
      }

      if (
        session.status === "expired" ||
        session.payment_status === "unpaid"
      ) {
        // Only expire if session is expired or past reservation TTL
        const expiredAt = order.reservation_expires_at
          ? new Date(order.reservation_expires_at).getTime() < Date.now()
          : true;
        if (session.status === "expired" || expiredAt) {
          await expirePendingOrder(supabase, order.id);
          expired += 1;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[cron/reconcile-orders] order failed:", order.id, message);
      failures.push({ id: order.id, error: message });
      await captureException(err, {
        cron: "reconcile-orders",
        orderId: order.id,
      });
    }
  }

  return NextResponse.json({
    ok: failures.length === 0,
    scanned: rows?.length ?? 0,
    fulfilled,
    expired,
    paidUnfulfilledAlerted: paidUnfulfilled,
    failed: failures.length,
    failures: failures.slice(0, 10),
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
