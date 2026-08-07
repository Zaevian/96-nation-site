import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin";
import {
  buildDoorCsv,
  listOrders,
  writeAdminAudit,
} from "@/lib/orders/admin";
import {
  canCreateServiceClient,
  createServiceClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders/export?event=&status=
 * Door CSV (Appendix F): one row per ticket unit.
 * Audited as action=csv_export.
 */
export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  if (!canCreateServiceClient()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const eventSlug = searchParams.get("event")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;

  const supabase = createServiceClient();

  let orders;
  try {
    // Higher limit for export (door list for an event)
    orders = await listOrders(supabase, {
      eventSlug,
      status,
      limit: 500,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "export_failed";
    console.error("[admin/orders/export]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const csv = buildDoorCsv(orders);
  const rowCount = csv.split("\n").filter((l) => l.length > 0).length - 1;

  try {
    await writeAdminAudit(supabase, auth.user.email!, "csv_export", {
      event_slug: eventSlug ?? null,
      status: status ?? null,
      order_count: orders.length,
      csv_row_count: rowCount,
    });
  } catch (err) {
    console.error("[admin/orders/export] audit failed:", err);
    return NextResponse.json(
      { error: "Audit log write failed; export aborted" },
      { status: 500 },
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const parts = ["orders", stamp];
  if (eventSlug) parts.push(eventSlug.replace(/[^a-z0-9-_]/gi, "_"));
  if (status) parts.push(status);
  const filename = `${parts.join("-")}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
