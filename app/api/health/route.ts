import { NextResponse } from "next/server";

import { createServiceClientOrNull } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — uptime probe. No secrets required.
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
    // Lightweight existence check — service role can read ticket_inventory
    const { error } = await supabase
      .from("ticket_inventory")
      .select("event_id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, db: "error", message: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, db: "ok" });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}
