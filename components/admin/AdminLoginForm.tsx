"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Props = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured in this browser build.");
      return;
    }

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const safeNext =
      nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/admin/orders";
    // Keep redirect URL path-only (no query). Supabase allow-lists often reject
    // `?next=...` with "Invalid path specified in request URL".
    // Persist intended destination for the callback page.
    try {
      sessionStorage.setItem("admin_auth_next", safeNext);
    } catch {
      /* private mode / blocked storage — callback defaults to /admin/orders */
    }
    const redirectTo = `${origin}/auth/callback`;

    // shouldCreateUser: true so first magic link can create the Auth user.
    // Access is still gated by ADMIN_EMAILS after callback (middleware + requireAdmin).
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      const msg = error.message || "Could not send magic link.";
      const generic =
        /signups not allowed|user not found|unable to validate/i.test(msg)
          ? "If this email is an admin account, check your inbox. Otherwise contact the owner to be invited."
          : /invalid path|redirect/i.test(msg)
            ? "Redirect URL is not allowed in Supabase. Add https://YOUR-SITE/auth/callback under Authentication → URL Configuration → Redirect URLs, then try again."
            : msg;
      setMessage(generic);
      return;
    }

    setStatus("sent");
    setMessage(
      `Check your inbox for a magic link. After signing in you’ll land on ${safeNext}. (Check spam if it doesn’t arrive in a minute.)`,
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="admin-email" className="block text-sm font-medium text-fg">
          Work email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg min-h-11"
        />
      </div>
      <Button type="submit" disabled={status === "sending"} aria-busy={status === "sending"}>
        {status === "sending" ? "Sending link…" : "Email magic link"}
      </Button>
      <p className="text-sm" role="status" aria-live="polite">
        {message ? (
          <span className={status === "error" ? "text-danger" : "text-accent"}>
            {message}
          </span>
        ) : null}
      </p>
    </form>
  );
}
