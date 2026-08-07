import "server-only";

import { createHash, randomBytes } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getFacilityFeeCents,
  RESERVATION_TTL_MINUTES,
} from "@/lib/env/ticketing";
import {
  InventoryError,
  mapRpcError,
  refundInventory,
} from "@/lib/inventory";

export type OrderRow = {
  id: string;
  event_slug: string;
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price_cents: number;
  facility_fee_cents: number;
  total_cents: number;
  currency: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  marketing_opt_in: boolean;
  status: string;
  idempotency_key: string;
  stripe_checkout_session_id: string | null;
  reservation_expires_at: string | null;
  confirm_token_hash: string | null;
  paid_at: string | null;
  created_at: string;
};

export function hashConfirmToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function generateConfirmToken(): string {
  return randomBytes(32).toString("base64url");
}

export function reservationExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + RESERVATION_TTL_MINUTES * 60 * 1000);
}

function asOrder(data: unknown): OrderRow | null {
  if (!data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as OrderRow) ?? null;
}

export async function findOrderByIdempotencyKey(
  client: SupabaseClient,
  idempotencyKey: string,
): Promise<OrderRow | null> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (error) {
    throw new Error(`orders lookup failed: ${error.message}`);
  }
  return (data as OrderRow | null) ?? null;
}

export type CreatePendingOrderInput = {
  eventSlug: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  unitPriceCents: number;
  buyer: { name: string; email: string; phone: string };
  marketingOptIn: boolean;
  idempotencyKey: string;
  currency?: string;
};

/**
 * Atomic Tx1 via `create_pending_order_with_reserve` RPC:
 * reserve + insert pending in one Postgres transaction.
 */
export async function createPendingOrderWithReserve(
  client: SupabaseClient,
  input: CreatePendingOrderInput,
): Promise<OrderRow> {
  const facilityFee =
    input.unitPriceCents > 0 ? getFacilityFeeCents() : 0;

  const { data, error } = await client.rpc("create_pending_order_with_reserve", {
    p_event_id: input.eventId,
    p_ticket_type_id: input.ticketTypeId,
    p_qty: input.quantity,
    p_event_slug: input.eventSlug,
    p_unit_price_cents: input.unitPriceCents,
    p_facility_fee_cents: facilityFee,
    p_currency: input.currency || "usd",
    p_buyer_name: input.buyer.name,
    p_buyer_email: input.buyer.email,
    p_buyer_phone: input.buyer.phone,
    p_marketing_opt_in: input.marketingOptIn,
    p_idempotency_key: input.idempotencyKey,
    p_reservation_minutes: RESERVATION_TTL_MINUTES,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const order = asOrder(data);
  if (!order) {
    throw new InventoryError(
      "create_pending_order_with_reserve returned no row",
      "RPC_FAILED",
    );
  }
  return order;
}

/**
 * Same idempotency key after `failed` (Stripe create failed previously):
 * re-reserve + status=pending + clear session + new TTL.
 */
export async function reactivateFailedOrderWithReserve(
  client: SupabaseClient,
  idempotencyKey: string,
): Promise<OrderRow> {
  const { data, error } = await client.rpc(
    "reactivate_failed_order_with_reserve",
    {
      p_idempotency_key: idempotencyKey,
      p_reservation_minutes: RESERVATION_TTL_MINUTES,
    },
  );

  if (error) {
    throw mapRpcError(error);
  }
  const order = asOrder(data);
  if (!order) {
    throw new InventoryError(
      "reactivate_failed_order_with_reserve returned no row",
      "RPC_FAILED",
    );
  }
  return order;
}

/**
 * Tx2 success: attach Stripe Checkout Session id to pending order.
 */
export async function attachStripeSessionId(
  client: SupabaseClient,
  orderId: string,
  sessionId: string,
): Promise<OrderRow> {
  const { data, error } = await client
    .from("orders")
    .update({ stripe_checkout_session_id: sessionId })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message || "Failed to attach stripe_checkout_session_id",
    );
  }
  return data as OrderRow;
}

/**
 * Clear stripe_checkout_session_id so a new Checkout Session can be created.
 */
export async function clearOrderStripeSession(
  client: SupabaseClient,
  orderId: string,
): Promise<OrderRow> {
  const { data, error } = await client.rpc("clear_order_stripe_session", {
    p_order_id: orderId,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const order = asOrder(data);
  if (!order) {
    throw new InventoryError(
      "clear_order_stripe_session returned no row",
      "RPC_FAILED",
    );
  }
  return order;
}

/**
 * Keep order.reservation_expires_at aligned with Stripe expires_at.
 */
export async function extendOrderReservation(
  client: SupabaseClient,
  orderId: string,
  expiresAt: Date,
): Promise<OrderRow> {
  const { data, error } = await client.rpc("extend_order_reservation", {
    p_order_id: orderId,
    p_expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw mapRpcError(error);
  }
  const order = asOrder(data);
  if (!order) {
    throw new InventoryError(
      "extend_order_reservation returned no row",
      "RPC_FAILED",
    );
  }
  return order;
}

/**
 * Atomic Tx2 failure: release reserve + mark failed.
 * Throws on release no-op (detected in SQL).
 */
export async function failPendingOrderAndRelease(
  client: SupabaseClient,
  order: Pick<OrderRow, "id" | "status">,
): Promise<OrderRow | null> {
  if (order.status !== "pending") return null;

  const { data, error } = await client.rpc("fail_pending_order", {
    p_order_id: order.id,
  });

  if (error) {
    // Surface release failures — do not pretend inventory was freed.
    console.error("[checkout] fail_pending_order RPC error:", error);
    throw mapRpcError(error);
  }

  return asOrder(data);
}

export type CreateRsvpOrderInput = {
  eventSlug: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyer: { name: string; email: string; phone: string };
  marketingOptIn: boolean;
  idempotencyKey: string;
  currency?: string;
};

/**
 * Atomic free RSVP via `finalize_rsvp_order` RPC.
 * reserve + commit sold + insert paid in one transaction.
 *
 * Fallback path (if RPC missing in older DBs): sequential with hard error
 * checks on refund_inventory — but primary path is atomic RPC.
 */
export async function createRsvpOrder(
  client: SupabaseClient,
  input: CreateRsvpOrderInput,
): Promise<{ order: OrderRow; confirmToken: string }> {
  const confirmToken = generateConfirmToken();
  const tokenHash = hashConfirmToken(confirmToken);

  const { data, error } = await client.rpc("finalize_rsvp_order", {
    p_event_id: input.eventId,
    p_ticket_type_id: input.ticketTypeId,
    p_qty: input.quantity,
    p_event_slug: input.eventSlug,
    p_currency: input.currency || "usd",
    p_buyer_name: input.buyer.name,
    p_buyer_email: input.buyer.email,
    p_buyer_phone: input.buyer.phone,
    p_marketing_opt_in: input.marketingOptIn,
    p_idempotency_key: input.idempotencyKey,
    p_confirm_token_hash: tokenHash,
  });

  if (error) {
    // If migration not applied yet, attempt sequential path with proper refund checks.
    if (/function .*finalize_rsvp_order.* does not exist/i.test(error.message)) {
      return createRsvpOrderSequential(client, input, confirmToken, tokenHash);
    }
    throw mapRpcError(error);
  }

  const order = asOrder(data);
  if (!order) {
    throw new InventoryError("finalize_rsvp_order returned no row", "RPC_FAILED");
  }
  return { order, confirmToken };
}

/** Sequential fallback with hard refund error checks (not silent). */
async function createRsvpOrderSequential(
  client: SupabaseClient,
  input: CreateRsvpOrderInput,
  confirmToken: string,
  tokenHash: string,
): Promise<{ order: OrderRow; confirmToken: string }> {
  // Dynamic import to avoid circular deps; use inventory helpers with error checks.
  const { reserveInventory, commitInventory, releaseInventory } = await import(
    "@/lib/inventory"
  );

  await reserveInventory(
    client,
    input.eventId,
    input.ticketTypeId,
    input.quantity,
  );

  try {
    await commitInventory(
      client,
      input.eventId,
      input.ticketTypeId,
      input.quantity,
    );
  } catch (err) {
    try {
      await releaseInventory(
        client,
        input.eventId,
        input.ticketTypeId,
        input.quantity,
        { requireEffect: true },
      );
    } catch (releaseErr) {
      console.error("[rsvp] release after commit fail:", releaseErr);
      throw releaseErr;
    }
    throw err;
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from("orders")
    .insert({
      event_slug: input.eventSlug,
      event_id: input.eventId,
      ticket_type_id: input.ticketTypeId,
      quantity: input.quantity,
      unit_price_cents: 0,
      facility_fee_cents: 0,
      total_cents: 0,
      currency: input.currency || "usd",
      buyer_name: input.buyer.name,
      buyer_email: input.buyer.email,
      buyer_phone: input.buyer.phone,
      marketing_opt_in: input.marketingOptIn,
      status: "paid",
      idempotency_key: input.idempotencyKey,
      confirm_token_hash: tokenHash,
      paid_at: now,
      reservation_expires_at: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    // Must check refund error — never silent.
    try {
      await refundInventory(
        client,
        input.eventId,
        input.ticketTypeId,
        input.quantity,
      );
    } catch (refundErr) {
      console.error(
        "[rsvp] CRITICAL: refund_inventory failed after insert fail — sold capacity may be stuck",
        refundErr,
      );
      throw refundErr instanceof Error
        ? refundErr
        : new Error("refund_inventory failed after RSVP insert failure");
    }
    throw new Error(error?.message || "Failed to insert RSVP order");
  }

  return { order: data as OrderRow, confirmToken };
}

export function isInventorySoldOut(err: unknown): boolean {
  return err instanceof InventoryError && err.code === "SOLD_OUT";
}

export function isInventoryMissing(err: unknown): boolean {
  return err instanceof InventoryError && err.code === "INVENTORY_MISSING";
}

export function isReservationExpired(order: OrderRow, now: Date = new Date()): boolean {
  if (!order.reservation_expires_at) return false;
  return new Date(order.reservation_expires_at).getTime() < now.getTime();
}
