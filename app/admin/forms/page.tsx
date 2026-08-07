import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import {
  canCreateServiceClient,
  createServiceClient,
} from "@/lib/supabase/server";
import type { FormType } from "@/lib/validations/forms";

export const metadata: Metadata = {
  title: "Form submissions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SubmissionRow = {
  id: string;
  form_type: FormType;
  payload: Record<string, unknown>;
  source_path: string | null;
  created_at: string;
  notified_at: string | null;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function payloadSummary(payload: Record<string, unknown>): string {
  const name = typeof payload.name === "string" ? payload.name : "—";
  const email = typeof payload.email === "string" ? payload.email : "—";
  return `${name} · ${email}`;
}

export default async function AdminFormsPage() {
  let rows: SubmissionRow[] = [];
  let loadError: string | null = null;
  const configured = canCreateServiceClient();

  if (configured) {
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("form_submissions")
        .select("id, form_type, payload, source_path, created_at, notified_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        loadError = error.message;
      } else {
        rows = (data ?? []) as SubmissionRow[];
      }
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to load";
    }
  }

  return (
    <Container className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Form submissions
        </h1>
        <p className="mt-2 text-sm text-muted">
          Genesis signup, service inquiry, and contact inbox (latest 100).
        </p>
      </header>

      {!configured ? (
        <p
          className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted"
          role="status"
        >
          Supabase service role is not configured. Set{" "}
          <code className="text-fg">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-fg">SUPABASE_SERVICE_ROLE_KEY</code> to list
          submissions.
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          Could not load submissions: {loadError}
        </p>
      ) : null}

      {configured && !loadError && rows.length === 0 ? (
        <p className="text-sm text-muted" role="status">
          No submissions yet.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <caption className="sr-only">Form submissions</caption>
            <thead className="bg-surface text-muted">
              <tr>
                <th scope="col" className="px-3 py-3 font-medium">
                  When
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Type
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  From
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Detail
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Notified
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border align-top text-fg"
                >
                  <td className="px-3 py-3 whitespace-nowrap text-muted">
                    <time dateTime={row.created_at}>
                      {formatDate(row.created_at)}
                    </time>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-bg px-2 py-0.5 font-mono text-xs">
                      {row.form_type}
                    </span>
                  </td>
                  <td className="px-3 py-3">{payloadSummary(row.payload)}</td>
                  <td className="px-3 py-3">
                    <details>
                      <summary className="cursor-pointer text-accent">
                        Payload
                      </summary>
                      <pre className="mt-2 max-w-md overflow-x-auto rounded bg-bg p-2 text-xs text-muted">
                        {JSON.stringify(row.payload, null, 2)}
                      </pre>
                      {row.source_path ? (
                        <p className="mt-1 text-xs text-muted">
                          source: {row.source_path}
                        </p>
                      ) : null}
                    </details>
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {row.notified_at ? formatDate(row.notified_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Container>
  );
}
