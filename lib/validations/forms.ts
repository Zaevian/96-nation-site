import { z } from "zod";

export const FORM_TYPES = ["signup", "service_inquiry", "contact"] as const;
export type FormType = (typeof FORM_TYPES)[number];

export function isFormType(value: string): value is FormType {
  return (FORM_TYPES as readonly string[]).includes(value);
}

/** DESIGN.md / ITU E.164: + then country digit 1–9, total 8–15 digits. */
export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export const SERVICE_TYPES = [
  "event_production",
  "booking",
  "media",
  "other",
] as const;

export const INTEREST_VALUES = [
  "events",
  "community",
  "volunteer",
  "media",
] as const;

/**
 * Normalize digit-only national numbers using DEFAULT_PHONE_REGION (default US).
 * Pass through already-valid E.164. Non-US regions currently require E.164 input.
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  if (E164_REGEX.test(trimmed)) {
    return trimmed;
  }

  const region = (process.env.DEFAULT_PHONE_REGION || "US").toUpperCase();
  const digits = trimmed.replace(/\D/g, "");

  if (region === "US" || region === "CA") {
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }
  }

  // Leave as-is for zod to reject (or accept if already almost-E.164 but loose)
  return trimmed;
}

const e164 = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .transform(normalizePhone)
  .refine((v) => E164_REGEX.test(v), {
    message: "Enter a valid phone number (E.164, e.g. +15551234567)",
  });

const optionalE164 = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? normalizePhone(v) : undefined))
  .refine((v) => v === undefined || E164_REGEX.test(v), {
    message: "Enter a valid phone number (E.164, e.g. +15551234567)",
  });

const nameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name is too long");

const emailField = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(254, "Email is too long");

const messageField = z
  .string()
  .trim()
  .max(2000, "Message is too long")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const requiredMessage = z
  .string()
  .trim()
  .min(1, "Message is required")
  .max(2000, "Message is too long");

/** Honeypot — must be empty / absent when submitted by a human. */
const honeypot = z.string().max(2000).optional();

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  phone: e164,
  interests: z
    .array(z.enum(INTEREST_VALUES))
    .max(INTEREST_VALUES.length)
    .optional()
    .default([]),
  message: messageField,
  website: honeypot,
});

export const serviceInquirySchema = z.object({
  name: nameField,
  email: emailField,
  phone: e164,
  serviceType: z.enum(SERVICE_TYPES, {
    message: "Select a valid service type",
  }),
  message: requiredMessage,
  website: honeypot,
});

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: optionalE164,
  message: requiredMessage,
  website: honeypot,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ServiceInquiryInput = z.infer<typeof serviceInquirySchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export function schemaForType(type: FormType) {
  switch (type) {
    case "signup":
      return signupSchema;
    case "service_inquiry":
      return serviceInquirySchema;
    case "contact":
      return contactSchema;
  }
}

/** Strip honeypot + unknown keys before DB insert. */
export function payloadForStorage(
  type: FormType,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const { website: _hp, ...rest } = data;
  void _hp;

  switch (type) {
    case "signup": {
      const { name, email, phone, interests, message } = rest as SignupInput;
      return {
        name,
        email,
        phone,
        ...(interests?.length ? { interests } : {}),
        ...(message ? { message } : {}),
      };
    }
    case "service_inquiry": {
      const { name, email, phone, serviceType, message } =
        rest as ServiceInquiryInput;
      return { name, email, phone, serviceType, message };
    }
    case "contact": {
      const { name, email, phone, message } = rest as ContactInput;
      return {
        name,
        email,
        ...(phone ? { phone } : {}),
        message,
      };
    }
  }
}
