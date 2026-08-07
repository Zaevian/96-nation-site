import { parsePhoneNumberFromString } from "libphonenumber-js";

import { getDefaultPhoneRegion } from "@/lib/env/ticketing";

/** E.164: + then country code starting 1–9, total 8–15 digits after +. */
export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Normalize user phone input to E.164.
 * Accepts already-E.164 or national numbers (default region US).
 * Returns null if invalid.
 */
export function normalizePhoneToE164(
  input: string,
  defaultRegion: string = getDefaultPhoneRegion(),
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Fast path: already valid E.164
  if (E164_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = parsePhoneNumberFromString(trimmed, defaultRegion as "US");
    if (!parsed || !parsed.isValid()) return null;
    const e164 = parsed.format("E.164");
    if (!E164_REGEX.test(e164)) return null;
    return e164;
  } catch {
    return null;
  }
}
