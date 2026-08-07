import { NextResponse } from "next/server";

import { authorizeCron } from "@/lib/cron/auth";
import { expireOrFulfillPendingOrder } from "@/lib/orders/stripe-expire";
import { captureException } from "@/lib/sentry";
import { createServiceClientOrNull } from "@/lib/supabase/server";
import type { OrderRow } from "@/lib/checkout/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET|POST /api/cron/release-reservations
 * Pending orders with reservation_expires_at < now():
 *   - If Stripe session paid → fulfill (O-3), else expire + release inventory.
 * Auth: Authorization: Bearer ${CRON_SECRET} only
 * Schedule: every 5 minutes (vercel.json)
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

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("orders")
    .select(
      "id, event_id, ticket_type_id, quantity, reservation_expires_at, stripe_checkout_session_id, status, event_slug",
    )
    .eq("status", "pending")
    .lt("reservation_expires_at", nowIso)
    .order("reservation_expires_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[cron/release-reservations] select failed:", error.message);
    await captureException(error, { cron: "release-reservations" });
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const expired: string[] = [];
  const fulfilled: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const row of rows ?? []) {
    try {
      const result = await expireOrFulfillPendingOrder(
        supabase,
        row as Pick<
          OrderRow,
          | "id"
          | "status"
          | "stripe_checkout_session_id"
          | "event_slug"
          | "event_id"
          | "ticket_type_id"
          | "quantity"
        >,
      );

      if (result.action === "fulfilled") {
        fulfilled.push(row.id);
      } else if (
        result.action === "expired" ||
        result.action === "already_terminal" ||
        result.action === "skipped"
      ) {
        expired.push(row.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        "[cron/release-reservations] expire/fulfill failed:",
        row.id,
        message,
      );
      failed.push({ id: row.id, error: message });
      await captureException(err, {
        cron: "release-reservations",
        orderId: row.id,
      });
    }
  }

  return NextResponse.json({
    ok: failed.length === 0,
    scanned: rows?.length ?? 0,
    expired: expired.length,
    fulfilled: fulfilled.length,
    failed: failed.length,
    failures: failed.slice(0, 10),
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
