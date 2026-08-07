"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    setDebug(null);

    const safeNext =
      nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/admin/orders";

    try {
      sessionStorage.setItem("admin_auth_next", safeNext);
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch("/api/admin/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
        siteUrlHint?: string;
        supabaseHost?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        const err = data.error ?? `Request failed (${res.status})`;
        setMessage(err);
        // Always show the exact redirect the server used so you can paste it into Supabase
        const lines = [
          data.redirectTo
            ? `Add this EXACT Redirect URL in Supabase → Authentication → URL Configuration:`
            : null,
          data.redirectTo ?? null,
          data.siteUrlHint
            ? `Set Site URL to: ${data.siteUrlHint}`
            : null,
          data.supabaseHost
            ? `Supabase project host in use: ${data.supabaseHost}`
            : null,
        ].filter(Boolean);
        setDebug(lines.length ? lines.join("\n") : null);
        return;
      }

      setStatus("sent");
      setMessage(
        `Check your inbox (and spam) for a magic link. After signing in you’ll go to ${safeNext}.`,
      );
      if (data.redirectTo) {
        setDebug(`Link will return to: ${data.redirectTo}`);
      }
    } catch {
      setStatus("error");
      setMessage("Network error sending magic link. Try again.");
    }
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
      {debug ? (
        <pre className="whitespace-pre-wrap rounded-md border border-border bg-bg px-3 py-2 text-xs text-muted">
          {debug}
        </pre>
      ) : null}
    </form>
  );
}
