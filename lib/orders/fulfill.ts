import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { OrderRow } from "@/lib/checkout/orders";
import { InventoryError, mapRpcError } from "@/lib/inventory";
import { sendOrderConfirmation } from "@/lib/email/outbox";

function asOrder(data: unknown): OrderRow | null {
  if (!data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as OrderRow) ?? null;
}

/**
 * Atomic fulfill: pending → paid + commit reserved → sold.
 * Idempotent when order is already non-pending.
 */
export async function fulfillPendingOrder(
  client: SupabaseClient,
  options: {
    orderId: string;
    stripePaymentIntentId?: string | null;
    stripeCheckoutSessionId?: string | null;
  },
): Promise<OrderRow> {
  const { data, error } = await client.rpc("fulfill_pending_order", {
    p_order_id: options.orderId,
    p_stripe_payment_intent_id: options.stripePaymentIntentId ?? null,
    p_stripe_checkout_session_id: options.stripeCheckoutSessionId ?? null,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const order = asOrder(data);
  if (!order) {
    throw new InventoryError(
      "fulfill_pending_order returned no row",
      "RPC_FAILED",
    );
  }
  return order;
}

/**
 * Expire pending reservation: release inventory + status=expired.
 * Idempotent when not pending.
 */
export async function expirePendingOrder(
  client: SupabaseClient,
  orderId: string,
): Promise<OrderRow | null> {
  if (!orderId) return null;

  const { data, error } = await client.rpc("expire_pending_order", {
    p_order_id: orderId,
  });

  if (error) {
    // Missing order is not fatal for webhook (stale metadata)
    if (/not found/i.test(error.message || "")) {
      console.warn("[orders] expire: order not found", orderId);
      return null;
    }
    throw mapRpcError(error);
  }
  return asOrder(data);
}

/**
 * Full refund: paid|fulfilled|partially_refunded → refunded + sold_count -= qty once.
 */
export async function refundPaidOrder(
  client: SupabaseClient,
  orderId: string,
  adminNote?: string,
): Promise<OrderRow> {
  const { data, error } = await client.rpc("refund_paid_order", {
    p_order_id: orderId,
    p_admin_note: adminNote ?? null,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const order = asOrder(data);
  if (!order) {
    throw new InventoryError("refund_paid_order returned no row", "RPC_FAILED");
  }
  return order;
}

/**
 * Partial refund: status only; no sold_count change.
 */
export async function markOrderPartiallyRefunded(
  client: SupabaseClient,
  orderId: string,
  adminNote?: string,
): Promise<OrderRow> {
  const { data, error } = await client.rpc("mark_order_partially_refunded", {
    p_order_id: orderId,
    p_admin_note: adminNote ?? null,
  });

  if (error) {
    throw mapRpcError(error);
  }
  const order = asOrder(data);
  if (!order) {
    throw new InventoryError(
      "mark_order_partially_refunded returned no row",
      "RPC_FAILED",
    );
  }
  return order;
}

export async function findOrderById(
  client: SupabaseClient,
  orderId: string,
): Promise<OrderRow | null> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`orders lookup failed: ${error.message}`);
  }
  return (data as OrderRow | null) ?? null;
}

export async function findOrderByPaymentIntent(
  client: SupabaseClient,
  paymentIntentId: string,
): Promise<OrderRow | null> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error) {
    throw new Error(`orders PI lookup failed: ${error.message}`);
  }
  return (data as OrderRow | null) ?? null;
}

export async function findOrderByCheckoutSession(
  client: SupabaseClient,
  sessionId: string,
): Promise<OrderRow | null> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`orders session lookup failed: ${error.message}`);
  }
  return (data as OrderRow | null) ?? null;
}

/**
 * After fulfill, enqueue + flush confirmation email (dedupe_key unique).
 * Never throws for email failure — caller should not fail webhook on Resend errors
 * once fulfill succeeded; outbox retains unsent row for later flush.
 */
export async function enqueueAndFlushOrderConfirmation(
  client: SupabaseClient,
  order: OrderRow,
  eventTitle: string,
  sessionId?: string | null,
): Promise<void> {
  try {
    await sendOrderConfirmation(client, {
      orderId: order.id,
      toEmail: order.buyer_email,
      buyerName: order.buyer_name,
      eventTitle,
      quantity: order.quantity,
      totalCents: order.total_cents,
      currency: order.currency,
      sessionId: sessionId ?? order.stripe_checkout_session_id ?? undefined,
    });
  } catch (err) {
    // Fulfill already committed; log and continue so webhook can mark processed.
    // Unique dedupe_key still prevents double send on retry after outbox insert.
    console.error("[orders] confirmation email error (non-fatal):", err);
  }
}
