"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client for admin magic-link auth only.
 * Do not use for ticketing/form writes (service role is server-only).
 */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !anonKey) {
    return null;
  }

  url = url.replace(/\/+$/, "").replace(/\/rest\/v1$/i, "").replace(/\/auth\/v1$/i, "");

  return createBrowserClient(url, anonKey);
}
