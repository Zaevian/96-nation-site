import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; next?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  auth_not_configured:
    "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  allowlist_empty:
    "ADMIN_EMAILS is empty. Add allowed admin emails (comma-separated) to the environment.",
  not_allowed:
    "That email is not on the admin allowlist. Contact the site owner.",
  auth_callback:
    "Magic link could not be completed (expired, already used, or cookie issue). Request a NEW link, click it once, and open it in the same browser without forwarding the email.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const errorKey = params.error;
  const banner =
    errorKey && ERROR_MESSAGES[errorKey]
      ? ERROR_MESSAGES[errorKey]
      : errorKey
        ? "Sign-in required."
        : null;

  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          Admin login
        </h1>
        <p className="mt-2 text-sm text-muted">
          Passwordless magic link via Supabase Auth. Only emails listed in{" "}
          <code className="text-fg">ADMIN_EMAILS</code> can access{" "}
          <code className="text-fg">/admin</code>.
        </p>

        {banner ? (
          <p
            className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {banner}
          </p>
        ) : null}

        {!authConfigured ? (
          <p className="mt-4 text-sm text-muted" role="status">
            Auth env vars are missing in this environment. Configure Supabase
            public URL + anon key, then reload.
          </p>
        ) : (
          <div className="mt-6">
            <AdminLoginForm nextPath={params.next ?? "/admin/orders"} />
          </div>
        )}
      </div>
    </Container>
  );
}
