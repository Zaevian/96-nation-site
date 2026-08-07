import "server-only";

import { timingSafeEqual } from "crypto";

/**
 * Constant-time string compare for secrets.
 * Returns false if either side is empty or lengths differ.
 */
export function timingSafeEqualString(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Authorize Bearer token against expected secret (timing-safe).
 * Accepts "Bearer <secret>" header value.
 */
export function authorizeBearer(
  authorizationHeader: string | null,
  expectedSecret: string,
): boolean {
  if (!authorizationHeader || !expectedSecret) return false;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  if (!match?.[1]) return false;
  return timingSafeEqualString(match[1].trim(), expectedSecret);
}
