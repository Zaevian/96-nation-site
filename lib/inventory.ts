import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type InventoryRow = {
  event_id: string;
  ticket_type_id: string;
  capacity: number;
  sold_count: number;
  reserved_count: number;
  version: number;
  updated_at: string;
};

export class InventoryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "SOLD_OUT"
      | "INVENTORY_MISSING"
      | "INVALID_QTY"
      | "RELEASE_NOOP"
      | "REFUND_NOOP"
      | "RPC_FAILED",
  ) {
    super(message);
    this.name = "InventoryError";
  }
}

export function mapRpcError(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}): InventoryError {
  const msg = error.message || "Inventory operation failed";
  const combined = `${msg} ${error.details || ""} ${error.hint || ""} ${error.code || ""}`;

  // PL/pgSQL errcodes: P0001 = raise_exception (SOLD_OUT), P0002 = no_data_found
  if (
    /SOLD_OUT/i.test(combined) ||
    error.code === "P0001" ||
    /insufficient capacity/i.test(combined)
  ) {
    return new InventoryError(msg, "SOLD_OUT");
  }
  if (
    /inventory row missing/i.test(combined) ||
    error.code === "P0002" ||
    /no_data_found/i.test(combined)
  ) {
    return new InventoryError(msg, "INVENTORY_MISSING");
  }
  if (/release_inventory returned 0 rows/i.test(combined)) {
    return new InventoryError(msg, "RELEASE_NOOP");
  }
  if (/qty must be/i.test(combined) || error.code === "22023") {
    return new InventoryError(msg, "INVALID_QTY");
  }
  return new InventoryError(msg, "RPC_FAILED");
}

function asRows(data: unknown): InventoryRow[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as InventoryRow[];
  return [data as InventoryRow];
}

/**
 * Hold capacity at paid session create or free RSVP start.
 * Wraps `reserve_inventory` RPC (row lock + capacity check).
 */
export async function reserveInventory(
  client: SupabaseClient,
  eventId: string,
  ticketTypeId: string,
  qty: number,
): Promise<InventoryRow> {
  const { data, error } = await client.rpc("reserve_inventory", {
    p_event_id: eventId,
    p_ticket_type_id: ticketTypeId,
    p_qty: qty,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const row = asRows(data)[0];
  if (!row) {
    throw new InventoryError("reserve_inventory returned no row", "RPC_FAILED");
  }
  return row;
}

/**
 * Move reserved → sold (paid webhook or free RSVP finalize).
 * Wraps `commit_inventory` RPC.
 */
export async function commitInventory(
  client: SupabaseClient,
  eventId: string,
  ticketTypeId: string,
  qty: number,
): Promise<InventoryRow> {
  const { data, error } = await client.rpc("commit_inventory", {
    p_event_id: eventId,
    p_ticket_type_id: ticketTypeId,
    p_qty: qty,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const row = asRows(data)[0];
  if (!row) {
    throw new InventoryError(
      "commit_inventory affected 0 rows (bad reserved state)",
      "RPC_FAILED",
    );
  }
  return row;
}

/**
 * Free reserved capacity (expire / cancel / Stripe create failure).
 * Wraps `release_inventory` RPC.
 *
 * @param requireEffect When true (default for fail path), 0-row release throws
 *   RELEASE_NOOP so callers cannot silently mark failed without freeing capacity.
 */
export async function releaseInventory(
  client: SupabaseClient,
  eventId: string,
  ticketTypeId: string,
  qty: number,
  options?: { requireEffect?: boolean },
): Promise<InventoryRow | null> {
  const requireEffect = options?.requireEffect ?? false;
  const { data, error } = await client.rpc("release_inventory", {
    p_event_id: eventId,
    p_ticket_type_id: ticketTypeId,
    p_qty: qty,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const row = asRows(data)[0] ?? null;
  if (!row && requireEffect) {
    throw new InventoryError(
      `release_inventory returned 0 rows for ${eventId}.${ticketTypeId} qty ${qty}`,
      "RELEASE_NOOP",
    );
  }
  return row;
}

/**
 * Decrement sold_count (full refund / RSVP insert-fail unwind).
 * Always checks `{ error }` from Supabase (RPC does not throw).
 * Throws REFUND_NOOP if 0 rows affected.
 */
export async function refundInventory(
  client: SupabaseClient,
  eventId: string,
  ticketTypeId: string,
  qty: number,
): Promise<InventoryRow> {
  const { data, error } = await client.rpc("refund_inventory", {
    p_event_id: eventId,
    p_ticket_type_id: ticketTypeId,
    p_qty: qty,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const row = asRows(data)[0];
  if (!row) {
    throw new InventoryError(
      `refund_inventory returned 0 rows for ${eventId}.${ticketTypeId} qty ${qty}`,
      "REFUND_NOOP",
    );
  }
  return row;
}

/**
 * Remaining = capacity - sold - reserved.
 */
export function remainingCapacity(
  row: Pick<InventoryRow, "capacity" | "sold_count" | "reserved_count">,
): number {
  return Math.max(0, row.capacity - row.sold_count - row.reserved_count);
}
