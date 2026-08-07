import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/env/ticketing";

export type OutboxTemplate =
  | "order_confirmation"
  | "rsvp_confirmation";

export type OrderConfirmPayload = {
  orderId: string;
  eventTitle: string;
  quantity: number;
  buyerName: string;
  successUrl?: string;
  totalCents?: number;
  currency?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(cents: number, currency = "usd"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

/**
 * Insert email_outbox row with unique dedupe_key (ignoreDuplicates).
 * Returns whether a new row was inserted (false if already present).
 */
export async function enqueueEmail(
  client: SupabaseClient,
  options: {
    dedupeKey: string;
    toEmail: string;
    template: OutboxTemplate;
    payload: OrderConfirmPayload;
  },
): Promise<{ enqueued: boolean }> {
  const { error } = await client.from("email_outbox").upsert(
    {
      dedupe_key: options.dedupeKey,
      to_email: options.toEmail,
      template: options.template,
      payload: options.payload,
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );

  if (error) {
    console.error("[email] outbox upsert failed:", error.message);
    throw new Error(`email_outbox upsert failed: ${error.message}`);
  }

  return { enqueued: true };
}

/**
 * Send via Resend and mark sent_at when successful.
 * Skips rows already sent. No-ops when RESEND_API_KEY / EMAIL_FROM missing.
 */
export async function flushEmailOutbox(
  client: SupabaseClient,
  dedupeKey?: string,
): Promise<{ sent: number; skipped: number; failed: number }> {
  let query = client
    .from("email_outbox")
    .select("*")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(20);

  if (dedupeKey) {
    query = client
      .from("email_outbox")
      .select("*")
      .eq("dedupe_key", dedupeKey)
      .is("sent_at", null)
      .limit(1);
  }

  const { data: rows, error } = await query;
  if (error) {
    console.error("[email] outbox select failed:", error.message);
    return { sent: 0, skipped: 0, failed: 1 };
  }

  if (!rows?.length) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return { sent: 0, skipped: rows.length, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const payload = (row.payload || {}) as OrderConfirmPayload;
      const built = buildEmail(row.template as OutboxTemplate, payload);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [row.to_email],
          subject: built.subject,
          text: built.text,
          html: built.html,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[email] Resend failed:", res.status, body);
        failed += 1;
        continue;
      }

      await client
        .from("email_outbox")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", row.id)
        .is("sent_at", null);

      // Soft mark confirmation_email_sent_at on orders when applicable
      if (payload.orderId) {
        await client
          .from("orders")
          .update({ confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", payload.orderId)
          .is("confirmation_email_sent_at", null);
      }

      sent += 1;
    } catch (err) {
      console.error("[email] flush row error:", err);
      failed += 1;
    }
  }

  return { sent, skipped: 0, failed };
}

function buildEmail(
  template: OutboxTemplate,
  payload: OrderConfirmPayload,
): { subject: string; text: string; html: string } {
  const eventTitle = payload.eventTitle || "your event";
  const buyerName = payload.buyerName || "there";
  const orderId = payload.orderId || "";
  const quantity = payload.quantity ?? 1;
  const successUrl =
    payload.successUrl ||
    `${getSiteUrl()}/checkout/success?order_id=${encodeURIComponent(orderId)}`;

  if (template === "rsvp_confirmation") {
    return {
      subject: `RSVP confirmed — ${eventTitle}`,
      text: [
        `Hi ${buyerName},`,
        ``,
        `Your RSVP for ${eventTitle} is confirmed.`,
        `Quantity: ${quantity}`,
        `Order: ${orderId}`,
        ``,
        `View confirmation: ${successUrl}`,
        ``,
        `— 96 Nation`,
      ].join("\n"),
      html: `
        <p>Hi ${escapeHtml(buyerName)},</p>
        <p>Your RSVP for <strong>${escapeHtml(eventTitle)}</strong> is confirmed.</p>
        <p>Quantity: ${quantity}<br/>Order: ${escapeHtml(orderId)}</p>
        <p><a href="${escapeHtml(successUrl)}">View confirmation</a></p>
        <p>— 96 Nation</p>
      `,
    };
  }

  // order_confirmation (paid)
  const totalLine =
    typeof payload.totalCents === "number"
      ? `Total: ${formatMoney(payload.totalCents, payload.currency || "usd")}`
      : null;

  return {
    subject: `Ticket confirmation — ${eventTitle}`,
    text: [
      `Hi ${buyerName},`,
      ``,
      `Your payment for ${eventTitle} is confirmed.`,
      `Quantity: ${quantity}`,
      totalLine,
      `Order: ${orderId}`,
      ``,
      `View confirmation: ${successUrl}`,
      ``,
      `— 96 Nation`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <p>Hi ${escapeHtml(buyerName)},</p>
      <p>Your payment for <strong>${escapeHtml(eventTitle)}</strong> is confirmed.</p>
      <p>Quantity: ${quantity}${
        totalLine
          ? `<br/>${escapeHtml(totalLine)}`
          : ""
      }<br/>Order: ${escapeHtml(orderId)}</p>
      <p><a href="${escapeHtml(successUrl)}">View confirmation</a></p>
      <p>— 96 Nation</p>
    `,
  };
}

/**
 * Enqueue + immediately attempt flush for a paid order confirmation.
 * Unique dedupe_key `order_confirm:{orderId}` prevents double send.
 */
export async function sendOrderConfirmation(
  client: SupabaseClient,
  options: {
    orderId: string;
    toEmail: string;
    buyerName: string;
    eventTitle: string;
    quantity: number;
    totalCents?: number;
    currency?: string;
    sessionId?: string;
  },
): Promise<{ sent: boolean }> {
  const successUrl = options.sessionId
    ? `${getSiteUrl()}/checkout/success?session_id=${encodeURIComponent(options.sessionId)}`
    : `${getSiteUrl()}/checkout/success?order_id=${encodeURIComponent(options.orderId)}`;

  const dedupeKey = `order_confirm:${options.orderId}`;

  await enqueueEmail(client, {
    dedupeKey,
    toEmail: options.toEmail,
    template: "order_confirmation",
    payload: {
      orderId: options.orderId,
      eventTitle: options.eventTitle,
      quantity: options.quantity,
      buyerName: options.buyerName,
      successUrl,
      totalCents: options.totalCents,
      currency: options.currency,
    },
  });

  const result = await flushEmailOutbox(client, dedupeKey);
  return { sent: result.sent > 0 };
}
