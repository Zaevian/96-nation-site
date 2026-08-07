import { NextResponse } from "next/server";
import { z } from "zod";

import { mapRpcError } from "@/lib/inventory";
import {
  authorizeBearer,
  timingSafeEqualString,
} from "@/lib/security/secrets";
import { createServiceClientOrNull } from "@/lib/supabase/server";
import { sanityFetch } from "@/lib/sanity/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/inventory/sync
 * Sanity publish → upsert ticket_inventory capacity.
 * Auth: Authorization: Bearer ${INVENTORY_SYNC_SECRET}
 *
 * Body (either):
 *   { eventId, ticketTypes: [{ id, capacity }] }
 *   { eventId } — load ticket types from Sanity by document id
 *   { slug } — load event by slug from Sanity
 */

const bodySchema = z.object({
  eventId: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  ticketTypes: z
    .array(
      z.object({
        id: z.string().min(1),
        capacity: z.number().int().min(0),
      }),
    )
    .optional(),
});

function authorize(request: Request): boolean {
  const secret = process.env.INVENTORY_SYNC_SECRET?.trim();
  if (!secret) {
    console.error("[inventory/sync] INVENTORY_SYNC_SECRET not configured");
    return false;
  }
  if (authorizeBearer(request.headers.get("authorization"), secret)) {
    return true;
  }
  // Optional header (timing-safe); prefer Bearer
  const header = request.headers.get("x-inventory-sync-secret");
  if (header && timingSafeEqualString(header, secret)) {
    return true;
  }
  return false;
}

type SanityTicket = { id?: string | null; capacity?: number | null };
type SanityEvent = {
  _id: string;
  title?: string | null;
  ticketTypes?: SanityTicket[] | null;
};

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClientOrNull();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  let eventId = input.eventId;
  let ticketTypes = input.ticketTypes;

  if (!ticketTypes || ticketTypes.length === 0 || !eventId) {
    const event = await loadEventFromSanity({
      eventId: input.eventId,
      slug: input.slug,
    });
    if (!event) {
      return NextResponse.json(
        { error: "Event not found in Sanity" },
        { status: 404 },
      );
    }
    eventId = event._id;
    ticketTypes = (event.ticketTypes || [])
      .filter((t): t is { id: string; capacity: number } =>
        Boolean(t.id && typeof t.capacity === "number"),
      )
      .map((t) => ({ id: t.id!, capacity: t.capacity! }));
  }

  if (!eventId || !ticketTypes?.length) {
    return NextResponse.json(
      { error: "No ticket types to sync" },
      { status: 400 },
    );
  }

  const results: {
    ticketTypeId: string;
    capacity: number;
    ok: boolean;
    error?: string;
  }[] = [];

  for (const tt of ticketTypes) {
    try {
      const { data, error } = await supabase.rpc("sync_inventory_capacity", {
        p_event_id: eventId,
        p_ticket_type_id: tt.id,
        p_capacity: tt.capacity,
      });

      if (error) {
        const mapped = mapRpcError(error);
        results.push({
          ticketTypeId: tt.id,
          capacity: tt.capacity,
          ok: false,
          error: mapped.message,
        });
        continue;
      }

      const row = Array.isArray(data) ? data[0] : data;
      results.push({
        ticketTypeId: tt.id,
        capacity: row?.capacity ?? tt.capacity,
        ok: true,
      });
    } catch (err) {
      results.push({
        ticketTypeId: tt.id,
        capacity: tt.capacity,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    {
      ok: allOk,
      eventId,
      results,
    },
    { status: allOk ? 200 : 422 },
  );
}

async function loadEventFromSanity(opts: {
  eventId?: string;
  slug?: string;
}): Promise<SanityEvent | null> {
  if (opts.eventId) {
    return sanityFetch<SanityEvent>(
      `*[_type == "event" && _id == $id][0]{
        _id,
        title,
        ticketTypes[]{ id, capacity }
      }`,
      { id: opts.eventId },
    );
  }
  if (opts.slug) {
    return sanityFetch<SanityEvent>(
      `*[_type == "event" && slug.current == $slug][0]{
        _id,
        title,
        ticketTypes[]{ id, capacity }
      }`,
      { slug: opts.slug },
    );
  }
  return null;
}
