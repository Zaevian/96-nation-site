import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { OrderRow } from "@/lib/checkout/orders";
import {
  enqueueAndFlushOrderConfirmation,
  expirePendingOrder,
  findOrderById,
  fulfillPendingOrder,
  refundPaidOrder,
  markOrderPartiallyRefunded,
} from "@/lib/orders/fulfill";
import { captureMessage } from "@/lib/sentry";
import { getStripe } from "@/lib/stripe";

export type AdminOrderRow = OrderRow & {
  stripe_payment_intent_id?: string | null;
  admin_note?: string | null;
  updated_at?: string | null;
};

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "fulfilled",
  "expired",
  "cancelled",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Write an admin_audit_log row (service role). Never throws to caller for UX paths. */
export async function writeAdminAudit(
  client: SupabaseClient,
  actorEmail: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await client.from("admin_audit_log").insert({
    actor_email: actorEmail,
    action,
    metadata: metadata ?? null,
  });
  if (error) {
    console.error("[admin_audit_log] insert failed:", error.message);
    throw new Error(`admin_audit_log insert failed: ${error.message}`);
  }
}

export type ListOrdersFilters = {
  eventSlug?: string;
  status?: string;
  limit?: number;
};

export async function listOrders(
  client: SupabaseClient,
  filters: ListOrdersFilters = {},
): Promise<AdminOrderRow[]> {
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  let query = client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.eventSlug) {
    query = query.eq("event_slug", filters.eventSlug);
  }
  if (filters.status && isOrderStatus(filters.status)) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`orders list failed: ${error.message}`);
  }
  return (data ?? []) as AdminOrderRow[];
}

/**
 * Distinct event_slug values for filter dropdown (latest first by max created_at).
 */
export async function listOrderEventSlugs(
  client: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await client
    .from("orders")
    .select("event_slug")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`orders event_slug list failed: ${error.message}`);
  }

  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const row of data ?? []) {
    const slug = (row as { event_slug: string }).event_slug;
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      slugs.push(slug);
    }
  }
  return slugs;
}

/** Escape a CSV field (RFC-style quotes). */
export function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Door CSV (DESIGN Appendix F): one row per ticket unit.
 * Columns: order_id, ticket_index, quantity_total, event_slug, ticket_type_id,
 * buyer_name, buyer_email, buyer_phone, status, paid_at
 */
export function buildDoorCsv(orders: AdminOrderRow[]): string {
  const header = [
    "order_id",
    "ticket_index",
    "quantity_total",
    "event_slug",
    "ticket_type_id",
    "buyer_name",
    "buyer_email",
    "buyer_phone",
    "status",
    "paid_at",
  ].join(",");

  const lines: string[] = [header];

  for (const order of orders) {
    const qty = Math.max(1, Number(order.quantity) || 1);
    for (let i = 1; i <= qty; i += 1) {
      lines.push(
        [
          csvEscape(order.id),
          csvEscape(i),
          csvEscape(qty),
          csvEscape(order.event_slug),
          csvEscape(order.ticket_type_id),
          csvEscape(order.buyer_name),
          csvEscape(order.buyer_email),
          csvEscape(order.buyer_phone),
          csvEscape(order.status),
          csvEscape(order.paid_at),
        ].join(","),
      );
    }
  }

  return lines.join("\n") + "\n";
}

export type ReconcileResult = {
  action:
    | "fulfilled"
    | "expired"
    | "refunded"
    | "partially_refunded"
    | "already_terminal"
    | "skipped"
    | "no_session"
    | "stripe_unavailable";
  order: AdminOrderRow | null;
  message: string;
};

async function applyChargeRefundSync(
  client: SupabaseClient,
  order: AdminOrderRow,
  charge: {
    amount?: number;
    amount_refunded?: number;
    refunded?: boolean;
  },
): Promise<ReconcileResult> {
  const amount = charge.amount ?? 0;
  const refunded = charge.amount_refunded ?? 0;
  const fullyRefunded =
    charge.refunded === true || (amount > 0 && refunded >= amount);

  if (refunded <= 0 && !charge.refunded) {
    return {
      action: "already_terminal",
      order,
      message: `Order is ${order.status}; Stripe shows no refund`,
    };
  }

  if (fullyRefunded) {
    if (order.status === "refunded") {
      return {
        action: "already_terminal",
        order,
        message: "Already fully refunded",
      };
    }
    const updated = await refundPaidOrder(
      client,
      order.id,
      "admin reconcile: full Stripe refund",
    );
    return {
      action: "refunded",
      order: updated as AdminOrderRow,
      message: "Synced full refund from Stripe",
    };
  }

  if (order.status !== "partially_refunded") {
    const updated = await markOrderPartiallyRefunded(
      client,
      order.id,
      "admin reconcile: partial Stripe refund",
    );
    return {
      action: "partially_refunded",
      order: updated as AdminOrderRow,
      message: "Synced partial refund from Stripe (capacity not restored)",
    };
  }

  return {
    action: "already_terminal",
    order,
    message: "Already partially_refunded",
  };
}

/**
 * Admin reconcile for a single order:
 * - pending/expired + Stripe session → fulfill if paid, expire if unpaid/expired
 * - paid/fulfilled + Stripe refunded → mark refunded (full/partial)
 * Writes no audit log (caller does).
 */
export async function reconcileOrder(
  client: SupabaseClient,
  orderId: string,
): Promise<ReconcileResult> {
  const order = await findOrderById(client, orderId);
  if (!order) {
    return {
      action: "skipped",
      order: null,
      message: "Order not found",
    };
  }

  const stripe = getStripe();
  const sessionId = order.stripe_checkout_session_id;
  const paymentIntentId =
    (order as AdminOrderRow).stripe_payment_intent_id ?? null;

  // Terminal statuses that only need refund sync if Stripe says refunded
  const paidLike = ["paid", "fulfilled", "partially_refunded"];
  const pendingLike = ["pending", "expired"];

  if (!stripe) {
    return {
      action: "stripe_unavailable",
      order: order as AdminOrderRow,
      message: "STRIPE_SECRET_KEY not configured",
    };
  }

  // Retrieve Checkout Session if present
  let session: {
    id: string;
    payment_status: string | null;
    status: string | null;
    payment_intent: string | { id: string } | null;
  } | null = null;

  if (sessionId) {
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      console.warn("[admin/reconcile] session retrieve failed:", orderId, err);
    }
  }

  // --- Pending / expired: fulfill-or-expire ---
  if (pendingLike.includes(order.status)) {
    if (!sessionId && !session) {
      // Free RSVP / no Stripe: nothing to reconcile via Stripe
      if (order.unit_price_cents === 0 && order.status === "pending") {
        return {
          action: "skipped",
          order: order as AdminOrderRow,
          message: "Pending free order has no Stripe session",
        };
      }
      return {
        action: "no_session",
        order: order as AdminOrderRow,
        message: "No Stripe checkout session on order",
      };
    }

    if (session && session.payment_status === "paid") {
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? paymentIntentId;

      const previousStatus = order.status;
      const updated = await fulfillPendingOrder(client, {
        orderId: order.id,
        stripePaymentIntentId: pi,
        stripeCheckoutSessionId: session.id,
      });

      if (updated.status === "paid" || updated.status === "fulfilled") {
        await captureMessage(
          "admin reconcile: paid Stripe session fulfilled",
          "warning",
          { orderId: order.id, sessionId: session.id, previousStatus },
        );

        if (previousStatus === "pending" || previousStatus === "expired") {
          try {
            const { getEventBySlug } = await import("@/lib/sanity/queries");
            const event = await getEventBySlug(updated.event_slug);
            await enqueueAndFlushOrderConfirmation(
              client,
              updated,
              event?.title || updated.event_slug,
              session.id,
            );
          } catch (emailErr) {
            console.error("[admin/reconcile] email:", emailErr);
          }
        }

        return {
          action: "fulfilled",
          order: updated as AdminOrderRow,
          message:
            previousStatus === "expired"
              ? "Resurrected expired order after paid Stripe session"
              : "Fulfilled pending order from paid Stripe session",
        };
      }

      return {
        action: "skipped",
        order: updated as AdminOrderRow,
        message: `Stripe paid but order status is ${updated.status}`,
      };
    }

    // Unpaid / expired session — expire pending only
    if (order.status === "pending") {
      if (
        !session ||
        session.status === "expired" ||
        session.payment_status === "unpaid"
      ) {
        const pastTtl = order.reservation_expires_at
          ? new Date(order.reservation_expires_at).getTime() < Date.now()
          : true;
        if (!session || session.status === "expired" || pastTtl) {
          const expired = await expirePendingOrder(client, order.id);
          return {
            action: "expired",
            order: (expired as AdminOrderRow) ?? (order as AdminOrderRow),
            message: "Expired pending reservation (Stripe unpaid/expired)",
          };
        }
      }
      return {
        action: "skipped",
        order: order as AdminOrderRow,
        message: "Session still open and within TTL — left pending",
      };
    }

    // expired + not paid
    return {
      action: "already_terminal",
      order: order as AdminOrderRow,
      message: "Order already expired and Stripe not paid",
    };
  }

  // --- Paid path: sync refund status from Stripe ---
  if (paidLike.includes(order.status)) {
    let piId = paymentIntentId;
    if (!piId && session) {
      piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
    }

    if (!piId) {
      return {
        action: "skipped",
        order: order as AdminOrderRow,
        message: "No payment intent to check refund status",
      };
    }

    try {
      // Refund amounts live on Charge (Stripe API); expand latest_charge.
      const pi = await stripe.paymentIntents.retrieve(piId, {
        expand: ["latest_charge"],
      });
      const latest = pi.latest_charge;
      const charge =
        latest && typeof latest === "object" && !("deleted" in latest && latest.deleted)
          ? (latest as { amount?: number; amount_refunded?: number; refunded?: boolean })
          : null;

      if (!charge) {
        // Fallback: list charges for the PI
        const charges = await stripe.charges.list({
          payment_intent: piId,
          limit: 1,
        });
        const c = charges.data[0];
        if (!c) {
          return {
            action: "skipped",
            order: order as AdminOrderRow,
            message: "No Stripe charge found for payment intent",
          };
        }
        return await applyChargeRefundSync(client, order as AdminOrderRow, c);
      }

      return await applyChargeRefundSync(client, order as AdminOrderRow, {
        amount: charge.amount ?? 0,
        amount_refunded: charge.amount_refunded ?? 0,
        refunded: charge.refunded === true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Refund sync failed: ${message}`);
    }
  }

  return {
    action: "already_terminal",
    order: order as AdminOrderRow,
    message: `No reconcile action for status ${order.status}`,
  };
}

/** Stripe Dashboard deep link for refunds. */
export function stripeDashboardOrderUrl(order: AdminOrderRow): string | null {
  const live = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live");
  const base = live
    ? "https://dashboard.stripe.com"
    : "https://dashboard.stripe.com/test";

  if (order.stripe_payment_intent_id) {
    return `${base}/payments/${order.stripe_payment_intent_id}`;
  }
  if (order.stripe_checkout_session_id) {
    return `${base}/search?query=${encodeURIComponent(order.stripe_checkout_session_id)}`;
  }
  return null;
}
