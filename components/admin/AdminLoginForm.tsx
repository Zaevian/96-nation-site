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
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

    // shouldCreateUser: false — admins must already exist in Supabase Auth
    // (invite via dashboard or create once). Prevents open user-table pollution.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus("error");
      // Avoid leaking whether an email exists when Supabase returns user-not-found style errors
      const generic =
        /signups not allowed|user not found|unable to validate/i.test(
          error.message,
        )
          ? "If this email is an admin account, check your inbox. Otherwise contact the owner to be invited."
          : error.message;
      setMessage(generic);
      return;
    }

    setStatus("sent");
    setMessage(
      `If this email is registered as an admin, a magic link is on the way. After signing in you’ll land on ${safeNext}.`,
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
