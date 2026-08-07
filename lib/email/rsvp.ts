import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/env/ticketing";

/**
 * Best-effort RSVP confirmation email via Resend + email_outbox dedupe.
 * No-ops when RESEND_API_KEY / EMAIL_FROM are unset (still returns success URL).
 */
export async function sendRsvpConfirmation(options: {
  client: SupabaseClient;
  orderId: string;
  toEmail: string;
  buyerName: string;
  eventTitle: string;
  quantity: number;
  confirmToken: string;
}): Promise<{ sent: boolean; successUrl: string }> {
  const successUrl = `${getSiteUrl()}/checkout/success?order_id=${encodeURIComponent(options.orderId)}&token=${encodeURIComponent(options.confirmToken)}`;

  const dedupeKey = `order_confirm:${options.orderId}`;
  const payload = {
    orderId: options.orderId,
    eventTitle: options.eventTitle,
    quantity: options.quantity,
    buyerName: options.buyerName,
    successUrl,
  };

  // Record outbox first (unique dedupe_key prevents double-send on retries).
  try {
    const { error: outboxError } = await options.client
      .from("email_outbox")
      .upsert(
        {
          dedupe_key: dedupeKey,
          to_email: options.toEmail,
          template: "rsvp_confirmation",
          payload,
        },
        { onConflict: "dedupe_key", ignoreDuplicates: true },
      );

    if (outboxError) {
      console.error("[email] outbox upsert failed:", outboxError.message);
    }
  } catch (err) {
    console.error("[email] outbox error:", err);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return { sent: false, successUrl };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.toEmail],
        subject: `RSVP confirmed — ${options.eventTitle}`,
        text: [
          `Hi ${options.buyerName},`,
          ``,
          `Your RSVP for ${options.eventTitle} is confirmed.`,
          `Quantity: ${options.quantity}`,
          `Order: ${options.orderId}`,
          ``,
          `View confirmation: ${successUrl}`,
          ``,
          `— 96 Nation`,
        ].join("\n"),
        html: `
          <p>Hi ${escapeHtml(options.buyerName)},</p>
          <p>Your RSVP for <strong>${escapeHtml(options.eventTitle)}</strong> is confirmed.</p>
          <p>Quantity: ${options.quantity}<br/>Order: ${escapeHtml(options.orderId)}</p>
          <p><a href="${successUrl}">View confirmation</a></p>
          <p>— 96 Nation</p>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend failed:", res.status, body);
      return { sent: false, successUrl };
    }

    // Mark outbox sent when possible
    try {
      await options.client
        .from("email_outbox")
        .update({ sent_at: new Date().toISOString() })
        .eq("dedupe_key", dedupeKey)
        .is("sent_at", null);
    } catch {
      // non-fatal
    }

    return { sent: true, successUrl };
  } catch (err) {
    console.error("[email] Resend request error:", err);
    return { sent: false, successUrl };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
