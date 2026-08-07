/**
 * Sanity environment helpers.
 * Safe to import from server and client. Build succeeds when env is unset.
 */

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

/** Raw project id from env (may be empty). */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";

/**
 * Placeholder used only so Studio config modules can load during builds
 * without credentials. Never used for real API calls when unconfigured.
 */
export const PLACEHOLDER_PROJECT_ID = "placeholder";

/** True when a real Sanity project id is present. */
export function isSanityConfigured(): boolean {
  return Boolean(projectId && projectId !== PLACEHOLDER_PROJECT_ID);
}

/**
 * Project id for Sanity Studio / client config.
 * Falls back to placeholder so imports do not throw at build time.
 */
export function getSanityProjectId(): string {
  return isSanityConfigured() ? projectId : PLACEHOLDER_PROJECT_ID;
}

/** Optional read token for draft/preview queries (server-only). */
export const readToken = process.env.SANITY_API_READ_TOKEN || "";
