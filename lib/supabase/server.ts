import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * True when both URL and service role key are present.
 * Prefer this over createServiceClient() when you need a graceful 503 path.
 */
export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — call only from Next.js Route Handlers / Server Actions /
 * Server Components after app-level authz (admin allowlist, cron secret, etc.).
 *
 * Never import this module into client components or expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser.
 * The `server-only` import fails the build if this module enters a client graph.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Same as createServiceClient but returns null when env is missing
 * (build-safe / graceful degrade for ticketing APIs).
 */
export function createServiceClientOrNull(): SupabaseClient | null {
  if (!isServiceRoleConfigured()) {
    return null;
  }
  return createServiceClient();
}
