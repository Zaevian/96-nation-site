import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin";
import { reconcileOrder, writeAdminAudit } from "@/lib/orders/admin";
import {
  canCreateServiceClient,
  createServiceClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/orders/[id]/reconcile
 * Fetch Stripe session / PI, fulfill-or-expire or sync refund.
 * Audited as action=reconcile.
 */
export async function POST(_request: Request, context: RouteContext) {
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

  const { id } = await context.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    const result = await reconcileOrder(supabase, id);

    if (!result.order && result.action === "skipped") {
      return NextResponse.json(
        { error: result.message, action: result.action },
        { status: 404 },
      );
    }

    // Fail-closed: DESIGN requires every reconcile write to admin_audit_log.
    // Reconcile may already have applied; surface that if audit fails.
    try {
      await writeAdminAudit(supabase, auth.user.email!, "reconcile", {
        order_id: id,
        action: result.action,
        message: result.message,
        resulting_status: result.order?.status ?? null,
      });
    } catch (auditErr) {
      console.error("[admin/reconcile] audit failed:", auditErr);
      return NextResponse.json(
        {
          error:
            "Reconcile applied but audit log write failed; check order status and admin_audit_log",
          action: result.action,
          message: result.message,
          order: result.order
            ? {
                id: result.order.id,
                status: result.order.status,
                paid_at: result.order.paid_at,
              }
            : null,
          audit_failed: true,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      action: result.action,
      message: result.message,
      order: result.order
        ? {
            id: result.order.id,
            status: result.order.status,
            paid_at: result.order.paid_at,
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "reconcile_failed";
    console.error("[admin/orders/reconcile]", id, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
