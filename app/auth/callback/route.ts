import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Complete magic-link sign-in.
 * Supports:
 * - PKCE: ?code=... → exchangeCodeForSession
 * - Token hash (server OTP / email templates): ?token_hash=...&type=magiclink → verifyOtp
 *
 * Cookies must be written onto the redirect Response (not only cookies()).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const errorDescription = searchParams.get("error_description");
  const errorCode = searchParams.get("error");

  const nextRaw = searchParams.get("next") ?? "/admin/orders";
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/admin/orders";

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "")
    .replace(/\/auth\/v1$/i, "");
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const fail = (error: string) => {
    const login = new URL("/admin/login", origin);
    login.searchParams.set("error", error);
    if (errorDescription) {
      login.searchParams.set("detail", errorDescription.slice(0, 200));
    }
    return NextResponse.redirect(login);
  };

  if (!url || !anonKey) {
    return fail("auth_not_configured");
  }

  // Supabase sometimes redirects with error query params
  if (errorCode || errorDescription) {
    console.error("[auth/callback] provider error", errorCode, errorDescription);
    return fail("auth_callback");
  }

  if (!code && !(token_hash && type)) {
    console.error("[auth/callback] missing code and token_hash", {
      keys: [...searchParams.keys()],
    });
    return fail("auth_callback");
  }

  let response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.redirect(new URL(next, origin));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let authError: { message: string } | null = null;

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    authError = error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  }

  if (authError) {
    console.error("[auth/callback] exchange/verify failed", authError.message);
    return fail("auth_callback");
  }

  // Confirm session exists before sending them into /admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    console.error("[auth/callback] no user after successful exchange");
    return fail("auth_callback");
  }

  return response;
}
