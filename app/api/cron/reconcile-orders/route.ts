import { NextResponse } from "next/server";

import type { OrderRow } from "@/lib/checkout/orders";
import { authorizeCron } from "@/lib/cron/auth";
import {
  enqueueAndFlushOrderConfirmation,
  expirePendingOrder,
  fulfillPendingOrder,
} from "@/lib/orders/fulfill";
import { captureException, captureMessage } from "@/lib/sentry";
import { getStripe } from "@/lib/stripe";
import { createServiceClientOrNull } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET|POST /api/cron/reconcile-orders
 * Backup for:
 *   - pending with session older than ~35m
 *   - expired with session (paid-but-expired O-3 recovery)
 * retrieve session → fulfill if paid, expire if expired/unpaid (pending only).
 * Auth: Authorization: Bearer ${CRON_SECRET} only
 * Schedule: every 15 minutes (vercel.json)
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
  // Look back 7 days for expired paid recovery
  const expiredLookback = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Pending with session (stuck checkout)
  const pendingQuery = supabase
    .from("orders")
    .select("*")
    .eq("status", "pending")
    .not("stripe_checkout_session_id", "is", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(50);

  // Expired with session — may have been paid after TTL expire (O-3)
  const expiredQuery = supabase
    .from("orders")
    .select("*")
    .eq("status", "expired")
    .not("stripe_checkout_session_id", "is", null)
    .gte("created_at", expiredLookback)
    .order("created_at", { ascending: true })
    .limit(50);

  const [pendingRes, expiredRes] = await Promise.all([
    pendingQuery,
    expiredQuery,
  ]);

  if (pendingRes.error) {
    console.error(
      "[cron/reconcile-orders] pending select failed:",
      pendingRes.error.message,
    );
    await captureException(pendingRes.error, { cron: "reconcile-orders" });
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }
  if (expiredRes.error) {
    console.error(
      "[cron/reconcile-orders] expired select failed:",
      expiredRes.error.message,
    );
    await captureException(expiredRes.error, { cron: "reconcile-orders" });
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  // Dedupe by id (shouldn't overlap statuses)
  const byId = new Map<string, OrderRow>();
  for (const row of [...(pendingRes.data ?? []), ...(expiredRes.data ?? [])]) {
    byId.set(row.id, row as OrderRow);
  }
  const rows = Array.from(byId.values());

  if (!stripe) {
    return NextResponse.json({
      ok: true,
      stub: true,
      pendingWithSession: pendingRes.data?.length ?? 0,
      expiredWithSession: expiredRes.data?.length ?? 0,
      message: "STRIPE_SECRET_KEY not set — reconcile skipped (counts only)",
    });
  }

  let fulfilled = 0;
  let expired = 0;
  let paidUnfulfilled = 0;
  let resurrected = 0;
  const failures: { id: string; error: string }[] = [];

  for (const order of rows) {
    const sessionId = order.stripe_checkout_session_id;
    if (!sessionId) continue;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const previousStatus = order.status;
        const updated = await fulfillPendingOrder(supabase, {
          orderId: order.id,
          stripePaymentIntentId: paymentIntentId,
          stripeCheckoutSessionId: session.id,
        });

        if (updated.status === "paid" || updated.status === "fulfilled") {
          fulfilled += 1;
          if (previousStatus === "pending") {
            paidUnfulfilled += 1;
            await captureMessage(
              "reconcile: paid Stripe session was still pending",
              "warning",
              { orderId: order.id, sessionId },
            );
          } else if (previousStatus === "expired") {
            resurrected += 1;
            await captureMessage(
              "reconcile: resurrected expired order after paid Stripe session",
              "warning",
              { orderId: order.id, sessionId },
            );
          }

          if (
            previousStatus === "pending" ||
            previousStatus === "expired"
          ) {
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
        } else {
          // Paid at Stripe but fulfill no-op on bad status
          await captureMessage(
            "reconcile: paid Stripe session but order not paid/fulfilled after fulfill",
            "error",
            {
              orderId: order.id,
              sessionId,
              orderStatus: updated.status,
            },
          );
          paidUnfulfilled += 1;
        }
        continue;
      }

      // Unpaid / expired session: only expire pending orders
      if (order.status === "pending") {
        if (
          session.status === "expired" ||
          session.payment_status === "unpaid"
        ) {
          const pastTtl = order.reservation_expires_at
            ? new Date(order.reservation_expires_at).getTime() < Date.now()
            : true;
          if (session.status === "expired" || pastTtl) {
            await expirePendingOrder(supabase, order.id);
            expired += 1;
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        "[cron/reconcile-orders] order failed:",
        order.id,
        message,
      );
      failures.push({ id: order.id, error: message });
      await captureException(err, {
        cron: "reconcile-orders",
        orderId: order.id,
      });
    }
  }

  return NextResponse.json({
    ok: failures.length === 0,
    scanned: rows.length,
    pendingScanned: pendingRes.data?.length ?? 0,
    expiredScanned: expiredRes.data?.length ?? 0,
    fulfilled,
    resurrected,
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
