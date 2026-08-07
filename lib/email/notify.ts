import "server-only";

import type { FormType } from "@/lib/validations/forms";

type FormNotifyArgs = {
  formType: FormType;
  payload: Record<string, unknown>;
  submissionId: string;
};

/**
 * Notify admin of a new form submission via Resend.
 * No-ops (returns false) when RESEND_API_KEY or ADMIN_NOTIFY_EMAIL is unset.
 */
export async function notifyAdminFormSubmission(
  args: FormNotifyArgs,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey || !to) {
    return { sent: false };
  }

  const name =
    typeof args.payload.name === "string" ? args.payload.name : "Unknown";
  const subject = `[Genesis] New ${args.formType} from ${name}`;

  const lines = Object.entries(args.payload)
    .map(([k, v]) => {
      const value = Array.isArray(v) ? v.join(", ") : String(v ?? "");
      return `${k}: ${value}`;
    })
    .join("\n");

  const text = [
    `New ${args.formType} submission`,
    `id: ${args.submissionId}`,
    "",
    lines,
  ].join("\n");

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      text,
    });

    if (error) {
      console.error("[email] Resend error", error);
      return { sent: false, error: error.message };
    }

    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "email_send_failed";
    console.error("[email] notify failed", err);
    return { sent: false, error: message };
  }
}
