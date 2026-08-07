import { createClient, type QueryParams, type SanityClient } from "next-sanity";

import {
  apiVersion,
  dataset,
  getSanityProjectId,
  isSanityConfigured,
  readToken,
} from "./env";

/**
 * Public (CDN) client for published content.
 * Returns null when Sanity env is not configured so pages can degrade gracefully.
 */
export function getClient(): SanityClient | null {
  if (!isSanityConfigured()) {
    return null;
  }

  return createClient({
    projectId: getSanityProjectId(),
    dataset,
    apiVersion,
    useCdn: true,
    perspective: "published",
    stega: false,
  });
}

/**
 * Server client with optional token for draft/preview reads.
 * Use only in server components / route handlers.
 */
export function getServerClient(options?: {
  preview?: boolean;
}): SanityClient | null {
  if (!isSanityConfigured()) {
    return null;
  }

  const preview = Boolean(options?.preview && readToken);

  return createClient({
    projectId: getSanityProjectId(),
    dataset,
    apiVersion,
    useCdn: !preview,
    token: preview ? readToken : undefined,
    perspective: preview ? "previewDrafts" : "published",
    stega: false,
  });
}

/**
 * Fetch helper. Returns null when Sanity is not configured or the query fails.
 */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {},
  options?: { preview?: boolean },
): Promise<T | null> {
  const client = getServerClient(options);
  if (!client) {
    return null;
  }

  try {
    return await client.fetch<T>(query, params);
  } catch (err) {
    console.error("[sanity] fetch failed:", err);
    return null;
  }
}
