import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/admin";
import { findOrderById } from "@/lib/orders/fulfill";
import {
  stripeDashboardOrderUrl,
  type AdminOrderRow,
} from "@/lib/orders/admin";
import { ReconcileButton } from "@/components/admin/ReconcileButton";
import {
  canCreateServiceClient,
  createServiceClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reconciled?: string; error?: string; msg?: string }>;
};

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

/** decodeURIComponent without throwing on malformed percent-encoding. */
function safeDecode(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const q = await searchParams;

  if (!canCreateServiceClient()) {
    return (
      <Container className="py-10">
        <p className="text-sm text-muted" role="status">
          Supabase service role is not configured.
        </p>
      </Container>
    );
  }

  const supabase = createServiceClient();
  let order: AdminOrderRow | null = null;
  try {
    order = (await findOrderById(supabase, id)) as AdminOrderRow | null;
  } catch {
    order = null;
  }

  if (!order) {
    notFound();
  }

  const stripeUrl = stripeDashboardOrderUrl(order);
  const canReconcile =
    order.status === "pending" ||
    order.status === "expired" ||
    order.status === "paid" ||
    order.status === "fulfilled" ||
    order.status === "partially_refunded";

  return (
    <Container className="py-10">
      <p className="mb-4 text-sm">
        <Link
          href="/admin/orders"
          className="text-muted no-underline hover:text-accent"
        >
          ← Orders
        </Link>
      </p>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Order detail
        </h1>
        <p className="mt-2 font-mono text-sm text-muted break-all">{order.id}</p>
      </header>

      {q.reconciled === "1" ? (
        <p
          className="mb-4 rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-fg"
          role="status"
        >
          Reconcile complete
          {(() => {
            const msg = safeDecode(q.msg);
            return msg ? `: ${msg}` : ".";
          })()}
        </p>
      ) : null}

      {q.error ? (
        <p
          className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {safeDecode(q.error)}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-lg border border-border bg-surface/40 p-5"
          aria-labelledby="buyer-heading"
        >
          <h2 id="buyer-heading" className="text-lg font-semibold text-fg">
            Buyer
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Name</dt>
              <dd className="text-fg">{order.buyer_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="text-fg break-all">{order.buyer_email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Phone</dt>
              <dd className="text-fg">{order.buyer_phone}</dd>
            </div>
          </dl>
        </section>

        <section
          className="rounded-lg border border-border bg-surface/40 p-5"
          aria-labelledby="ticket-heading"
        >
          <h2 id="ticket-heading" className="text-lg font-semibold text-fg">
            Ticket
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Event</dt>
              <dd className="font-mono text-xs text-fg">{order.event_slug}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Ticket type</dt>
              <dd className="font-mono text-xs text-fg">
                {order.ticket_type_id}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Quantity</dt>
              <dd className="text-fg tabular-nums">{order.quantity}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Unit</dt>
              <dd className="text-fg">
                {formatMoney(order.unit_price_cents, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Facility fee</dt>
              <dd className="text-fg">
                {formatMoney(order.facility_fee_cents, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Total</dt>
              <dd className="font-semibold text-fg">
                {formatMoney(order.total_cents, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd className="font-mono text-xs text-fg">{order.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Created</dt>
              <dd className="text-fg">{formatDate(order.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Paid at</dt>
              <dd className="text-fg">{formatDate(order.paid_at)}</dd>
            </div>
            {order.reservation_expires_at ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Reserve expires</dt>
                <dd className="text-fg">
                  {formatDate(order.reservation_expires_at)}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section
          className="rounded-lg border border-border bg-surface/40 p-5 lg:col-span-2"
          aria-labelledby="stripe-heading"
        >
          <h2 id="stripe-heading" className="text-lg font-semibold text-fg">
            Stripe
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-muted">Checkout session</dt>
              <dd className="font-mono text-xs text-fg break-all">
                {order.stripe_checkout_session_id || "n/a"}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-muted">Payment intent</dt>
              <dd className="font-mono text-xs text-fg break-all">
                {order.stripe_payment_intent_id || "n/a"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            {canReconcile ? (
              <ReconcileButton orderId={order.id} />
            ) : (
              <p className="text-sm text-muted">
                Reconcile not applicable for status{" "}
                <code className="text-fg">{order.status}</code>.
              </p>
            )}
            {stripeUrl ? (
              <ButtonLink href={stripeUrl} variant="secondary">
                Refund in Stripe
              </ButtonLink>
            ) : (
              <span className="text-sm text-muted">
                No Stripe IDs. Open Dashboard manually if needed.
              </span>
            )}
          </div>
        </section>

        <section
          className="rounded-lg border border-border bg-surface/40 p-5 lg:col-span-2"
          aria-labelledby="refund-heading"
        >
          <h2 id="refund-heading" className="text-lg font-semibold text-fg">
            Refund instructions
          </h2>
          <p className="mt-2 text-sm text-muted">
            Refunds are processed in Stripe Dashboard (PCI-minimal). This app
            never holds card data.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-fg">
            <li>
              Open this order → click <strong>Refund in Stripe</strong> (or find
              the payment in Stripe Dashboard).
            </li>
            <li>Issue a <strong>full refund</strong> in Stripe Dashboard.</li>
            <li>
              Within ~15 minutes the webhook should set status{" "}
              <code className="text-muted">refunded</code> and restore capacity
              once (
              <code className="text-muted">sold_count -= quantity</code>).
            </li>
            <li>
              If status is still wrong, click <strong>Reconcile</strong> / Sync
              refund status. If still wrong, check{" "}
              <code className="text-muted">stripe_webhook_events</code> and
              Stripe delivery logs.
            </li>
            <li>
              <strong>Partial refund:</strong> status becomes{" "}
              <code className="text-muted">partially_refunded</code>; edit the
              door list manually; capacity is not auto-restored.
            </li>
          </ol>
        </section>
      </div>
    </Container>
  );
}
