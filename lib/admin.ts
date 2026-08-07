import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createAuthServerClient } from "@/lib/supabase/server";

/** Admin allowlist helpers (ADMIN_EMAILS comma-separated). */

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = getAdminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

export function hasSupabaseAuthEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasServiceRoleEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Page-level authz (defense in depth beyond middleware).
 * Redirects to /admin/login when unauthenticated or not allowlisted.
 */
export async function requireAdmin(): Promise<User> {
  const auth = await createAuthServerClient();
  if (!auth) {
    redirect("/admin/login?error=auth_not_configured");
  }

  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user?.email) {
    redirect("/admin/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/admin/login?error=not_allowed");
  }

  return user;
}

/**
 * API-route authz. Returns the user or a 401/403 NextResponse-shaped result.
 */
export async function requireAdminApi(): Promise<
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; error: string }
> {
  const auth = await createAuthServerClient();
  if (!auth) {
    return { ok: false, status: 401, error: "auth_not_configured" };
  }

  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user?.email) {
    return { ok: false, status: 401, error: "unauthenticated" };
  }

  if (!isAdminEmail(user.email)) {
    return { ok: false, status: 403, error: "not_allowed" };
  }

  return { ok: true, user };
}
