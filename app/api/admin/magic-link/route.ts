import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(320),
});

function normalizeSupabaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  // Common paste mistakes
  u = u.replace(/\/rest\/v1$/i, "");
  u = u.replace(/\/auth\/v1$/i, "");
  return u;
}

function siteOrigin(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
    return fromEnv;
  }
  // Fallback production hosts (prefer vercel app for first setup)
  return "https://96-nation-site.vercel.app";
}

/**
 * Server-side magic link so emailRedirectTo is a fixed, allowlisted URL
 * (not derived from a weird browser origin).
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!rawUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const url = normalizeSupabaseUrl(rawUrl);
  const origin = siteOrigin();
  const redirectTo = `${origin}/auth/callback`;

  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const email = parsed.data.email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[admin/magic-link]", {
      message: error.message,
      status: error.status,
      name: error.name,
      redirectTo,
      supabaseUrl: url,
    });
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        // Help the operator copy the exact URL into Supabase allowlist
        redirectTo,
        siteUrlHint: origin,
        supabaseHost: (() => {
          try {
            return new URL(url).host;
          } catch {
            return url;
          }
        })(),
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    redirectTo,
  });
}
