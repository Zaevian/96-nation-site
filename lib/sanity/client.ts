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

export type SanityFetchOptions = {
  preview?: boolean;
  /** Next.js cache tags for on-demand revalidation via /api/revalidate. */
  tags?: string[];
  /**
   * ISR revalidate seconds. Default 60 when tags are set, else undefined
   * (request-time). Pass `false` to force dynamic (no static cache).
   */
  revalidate?: number | false;
};

/**
 * Fetch helper. Returns null when Sanity is not configured or the query fails.
 * When `tags` are provided, Next caches the result and /api/revalidate can
 * bust it with `revalidateTag`.
 */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {},
  options?: SanityFetchOptions,
): Promise<T | null> {
  const client = getServerClient(options);
  if (!client) {
    return null;
  }

  const tags = options?.tags?.filter(Boolean);
  const nextOpts: { tags?: string[]; revalidate?: number | false } = {};
  if (tags && tags.length > 0) {
    nextOpts.tags = tags;
    nextOpts.revalidate =
      options?.revalidate === undefined ? 60 : options.revalidate;
  } else if (options?.revalidate !== undefined) {
    nextOpts.revalidate = options.revalidate;
  }

  try {
    return await client.fetch<T>(query, params, {
      next: Object.keys(nextOpts).length > 0 ? nextOpts : undefined,
    });
  } catch (err) {
    console.error("[sanity] fetch failed:", err);
    return null;
  }
}
