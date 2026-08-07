import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { enqueueEmail, flushEmailOutbox } from "@/lib/email/outbox";
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

  try {
    await enqueueEmail(options.client, {
      dedupeKey,
      toEmail: options.toEmail,
      template: "rsvp_confirmation",
      payload: {
        orderId: options.orderId,
        eventTitle: options.eventTitle,
        quantity: options.quantity,
        buyerName: options.buyerName,
        successUrl,
      },
    });
  } catch (err) {
    console.error("[email] RSVP outbox error:", err);
  }

  const result = await flushEmailOutbox(options.client, dedupeKey);
  return { sent: result.sent > 0, successUrl };
}
