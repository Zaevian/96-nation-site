import { NextResponse } from "next/server";

import { createServiceClientOrNull } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — uptime probe. No secrets required.
 * Opaque errors only (no raw DB messages to clients).
 */
export async function GET() {
  const supabase = createServiceClientOrNull();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      db: "unconfigured",
    });
  }

  try {
    const { error } = await supabase
      .from("ticket_inventory")
      .select("event_id")
      .limit(1);

    if (error) {
      console.error("[health] db error:", error.message);
      return NextResponse.json({ ok: false, db: "error" }, { status: 503 });
    }

    return NextResponse.json({ ok: true, db: "ok" });
  } catch (err) {
    console.error("[health] exception:", err);
    return NextResponse.json({ ok: false, db: "error" }, { status: 503 });
  }
}
