import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/admin";
import {
  isOrderStatus,
  listOrderEventSlugs,
  listOrders,
  ORDER_STATUSES,
  type AdminOrderRow,
} from "@/lib/orders/admin";
import {
  canCreateServiceClient,
  createServiceClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  event?: string;
  status?: string;
  exported?: string;
  reconciled?: string;
  error?: string;
}>;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "n/a";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatMoney(cents: number, currency = "usd"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function statusClass(status: string): string {
  switch (status) {
    case "paid":
    case "fulfilled":
      return "bg-accent/15 text-accent";
    case "pending":
      return "bg-surface text-muted border border-border";
    case "expired":
    case "failed":
    case "cancelled":
      return "bg-danger/10 text-danger";
    case "refunded":
    case "partially_refunded":
      return "bg-muted/20 text-muted";
    default:
      return "bg-surface text-fg";
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const eventSlug = params.event?.trim() || undefined;
  const statusRaw = params.status?.trim() || undefined;
  const statusInvalid = Boolean(statusRaw && !isOrderStatus(statusRaw));
  const status = statusInvalid ? undefined : statusRaw;

  let rows: AdminOrderRow[] = [];
  let eventSlugs: string[] = [];
  let loadError: string | null = null;
  const configured = canCreateServiceClient();

  if (configured) {
    try {
      const supabase = createServiceClient();
      const [orders, slugs] = await Promise.all([
        listOrders(supabase, { eventSlug, status, limit: 200 }),
        listOrderEventSlugs(supabase),
      ]);
      rows = orders;
      eventSlugs = slugs;
      // Ensure current filter slug appears even if outside recent set
      if (eventSlug && !eventSlugs.includes(eventSlug)) {
        eventSlugs = [eventSlug, ...eventSlugs];
      }
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to load orders";
    }
  }

  const exportQuery = new URLSearchParams();
  if (eventSlug) exportQuery.set("event", eventSlug);
  // Only pass valid status to export (invalid would 400)
  if (status) exportQuery.set("status", status);
  const exportHref = `/api/admin/orders/export${
    exportQuery.toString() ? `?${exportQuery.toString()}` : ""
  }`;

  const filterBase = "/admin/orders";

  return (
    <Container className="py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Orders</h1>
          <p className="mt-2 text-sm text-muted">
            Buyer PII + quantity. Door CSV expands one row per ticket unit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={exportHref} variant="secondary">
            Export door CSV
          </ButtonLink>
        </div>
      </header>

      {params.exported === "1" ? (
        <p
          className="mb-4 rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-fg"
          role="status"
        >
          CSV export completed (audited).
        </p>
      ) : null}

      {params.error ? (
        <p
          className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {params.error}
        </p>
      ) : null}

      {statusInvalid ? (
        <p
          className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          Unknown status filter &quot;{statusRaw}&quot; was ignored. Choose a
          status from the list.
        </p>
      ) : null}

      {!configured ? (
        <p
          className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted"
          role="status"
        >
          Supabase service role is not configured. Set{" "}
          <code className="text-fg">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-fg">SUPABASE_SERVICE_ROLE_KEY</code> to list
          orders.
        </p>
      ) : null}

      {loadError ? (
        <p
          className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          Could not load orders: {loadError}
        </p>
      ) : null}

      {configured && !loadError ? (
        <form
          method="get"
          action={filterBase}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface/50 p-4"
        >
          <div>
            <label
              htmlFor="filter-event"
              className="block text-xs font-medium text-muted"
            >
              Event
            </label>
            <select
              id="filter-event"
              name="event"
              defaultValue={eventSlug ?? ""}
              className="mt-1 min-h-11 rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
            >
              <option value="">All events</option>
              {eventSlugs.map((slug) => (
                <option key={slug} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filter-status"
              className="block text-xs font-medium text-muted"
            >
              Status
            </label>
            <select
              id="filter-status"
              name="status"
              defaultValue={statusInvalid ? "" : (status ?? "")}
              className="mt-1 min-h-11 rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="min-h-11 rounded-md border border-border bg-bg px-4 py-2 text-sm font-semibold text-fg hover:border-muted"
          >
            Apply filters
          </button>
          {eventSlug || status ? (
            <Link
              href={filterBase}
              className="min-h-11 px-2 py-2 text-sm text-muted no-underline hover:text-accent"
            >
              Clear
            </Link>
          ) : null}
        </form>
      ) : null}

      {configured && !loadError && rows.length === 0 ? (
        <p className="text-sm text-muted" role="status">
          No orders match these filters.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <caption className="sr-only">Orders</caption>
            <thead className="bg-surface text-muted">
              <tr>
                <th scope="col" className="px-3 py-3 font-medium">
                  When
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Event
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Buyer
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Qty
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Total
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Actions
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
                    <span className="font-mono text-xs">{row.event_slug}</span>
                    <div className="mt-0.5 text-xs text-muted">
                      {row.ticket_type_id}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{row.buyer_name}</div>
                    <div className="text-xs text-muted">{row.buyer_email}</div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{row.quantity}</td>
                  <td className="px-3 py-3 tabular-nums whitespace-nowrap">
                    {formatMoney(row.total_cents, row.currency)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 font-mono text-xs ${statusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="text-accent no-underline hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <p className="mt-3 text-xs text-muted">
          Showing {rows.length} order{rows.length === 1 ? "" : "s"}
          {eventSlug ? ` · event ${eventSlug}` : ""}
          {status ? ` · status ${status}` : ""}. Export expands quantity into
          door lines.
        </p>
      ) : null}
    </Container>
  );
}
