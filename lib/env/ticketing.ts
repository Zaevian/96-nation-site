/**
 * Ticketing-related env helpers.
 * Safe defaults so the app builds without keys.
 */

/** Feature flag — hide CTAs / block checkout when false. */
export function isTicketingEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_TICKETING_ENABLED;
  if (v === undefined || v === "") return true; // default on for local/dev UX
  return v === "true" || v === "1";
}

/**
 * Facility fee per paid order (cents). Default 100 = $1.00.
 * Free/RSVP path must use 0 regardless of this value.
 */
export function getFacilityFeeCents(): number {
  const raw = process.env.FACILITY_FEE_CENTS;
  if (raw === undefined || raw === "") return 100;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 100;
  return n;
}

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return url || "http://localhost:3000";
}

export function getDefaultPhoneRegion(): string {
  return process.env.DEFAULT_PHONE_REGION || "US";
}

/** Reservation / Stripe Checkout TTL in minutes. */
export const RESERVATION_TTL_MINUTES = 30;
