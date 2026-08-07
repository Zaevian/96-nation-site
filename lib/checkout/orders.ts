import "server-only";

import { createHash, randomBytes } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  commitInventory,
  InventoryError,
  releaseInventory,
  reserveInventory,
} from "@/lib/inventory";
import {
  getFacilityFeeCents,
  RESERVATION_TTL_MINUTES,
} from "@/lib/env/ticketing";

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

export function reservationExpiresAt(
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + RESERVATION_TTL_MINUTES * 60 * 1000);
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
 * Tx1: reserve inventory then insert pending order (no Stripe session yet).
 * On insert failure after reserve, releases capacity.
 */
export async function createPendingOrderWithReserve(
  client: SupabaseClient,
  input: CreatePendingOrderInput,
): Promise<OrderRow> {
  const facilityFee =
    input.unitPriceCents > 0 ? getFacilityFeeCents() : 0;
  const total =
    input.unitPriceCents * input.quantity + facilityFee;
  const expires = reservationExpiresAt();

  await reserveInventory(
    client,
    input.eventId,
    input.ticketTypeId,
    input.quantity,
  );

  const { data, error } = await client
    .from("orders")
    .insert({
      event_slug: input.eventSlug,
      event_id: input.eventId,
      ticket_type_id: input.ticketTypeId,
      quantity: input.quantity,
      unit_price_cents: input.unitPriceCents,
      facility_fee_cents: facilityFee,
      total_cents: total,
      currency: input.currency || "usd",
      buyer_name: input.buyer.name,
      buyer_email: input.buyer.email,
      buyer_phone: input.buyer.phone,
      marketing_opt_in: input.marketingOptIn,
      status: "pending",
      idempotency_key: input.idempotencyKey,
      reservation_expires_at: expires.toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    // Best-effort release so we do not hold capacity without an order row.
    try {
      await releaseInventory(
        client,
        input.eventId,
        input.ticketTypeId,
        input.quantity,
      );
    } catch (releaseErr) {
      console.error(
        "[checkout] release after failed order insert:",
        releaseErr,
      );
    }
    throw new Error(
      error?.message || "Failed to insert pending order after reserve",
    );
  }

  return data as OrderRow;
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
 * Tx2 failure: release reserve + mark order failed.
 */
export async function failPendingOrderAndRelease(
  client: SupabaseClient,
  order: Pick<
    OrderRow,
    "id" | "event_id" | "ticket_type_id" | "quantity" | "status"
  >,
): Promise<void> {
  if (order.status !== "pending") return;

  try {
    await releaseInventory(
      client,
      order.event_id,
      order.ticket_type_id,
      order.quantity,
    );
  } catch (err) {
    // Log but still try to mark failed so ops can reconcile.
    console.error("[checkout] release on fail path:", err);
  }

  const { error } = await client
    .from("orders")
    .update({ status: "failed" })
    .eq("id", order.id)
    .eq("status", "pending");

  if (error) {
    console.error("[checkout] mark failed:", error.message);
  }
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
 * Free RSVP: reserve → commit sold → insert order paid/fulfilled with token hash.
 * No facility fee. On failure after inventory change, best-effort unwind.
 */
export async function createRsvpOrder(
  client: SupabaseClient,
  input: CreateRsvpOrderInput,
): Promise<{ order: OrderRow; confirmToken: string }> {
  const confirmToken = generateConfirmToken();
  const tokenHash = hashConfirmToken(confirmToken);
  const now = new Date().toISOString();

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
      );
    } catch (releaseErr) {
      console.error("[rsvp] release after commit fail:", releaseErr);
    }
    throw err;
  }

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
    // Undo sold: cannot easily reverse commit without refund_inventory —
    // try refund_inventory RPC if available.
    try {
      await client.rpc("refund_inventory", {
        p_event_id: input.eventId,
        p_ticket_type_id: input.ticketTypeId,
        p_qty: input.quantity,
      });
    } catch (refundErr) {
      console.error("[rsvp] refund_inventory after insert fail:", refundErr);
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
