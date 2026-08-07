import { z } from "zod";

import { E164_REGEX, normalizePhoneToE164 } from "./phone";

export const buyerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
  email: z.string().trim().email("Valid email is required").max(254),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .transform((val, ctx) => {
      const e164 = normalizePhoneToE164(val);
      if (!e164 || !E164_REGEX.test(e164)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Phone must be a valid number (E.164, e.g. +15551234567)",
        });
        return z.NEVER;
      }
      return e164;
    }),
});

export const checkoutBodySchema = z.object({
  eventSlug: z.string().trim().min(1).max(200),
  ticketTypeId: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(50),
  buyer: buyerSchema,
  marketingOptIn: z.boolean().optional().default(false),
  /** Client UUID v4 — unique on orders for double-submit safety. */
  idempotencyKey: z.string().uuid("idempotencyKey must be a UUID"),
  /** Optional legal acknowledgment (stub for PR 11). */
  acceptedLegal: z.boolean().optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;

export type CheckoutErrorCode =
  | "SOLD_OUT"
  | "VALIDATION"
  | "NOT_ON_SALE"
  | "RATE_LIMITED"
  | "FREE_EVENT_USE_RSVP"
  | "PAID_EVENT_USE_SESSION"
  | "TICKETING_DISABLED"
  | "NOT_CONFIGURED"
  | "CONFLICT"
  | "NOT_FOUND"
  | "CANCELLED"
  | "STRIPE_ERROR"
  | "INVENTORY_MISSING"
  | "INTERNAL";
