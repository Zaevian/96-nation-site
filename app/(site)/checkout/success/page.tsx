import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { resolveSuccessView } from "@/lib/checkout/success";
import { getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    ...buildPageMetadata({
      title: "Order confirmation",
      description: "Your ticket or RSVP confirmation.",
      path: "/checkout/success",
      settings,
    }),
    robots: { index: false, follow: false },
  };
}

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
    order_id?: string;
    token?: string;
  }>;
};

/**
 * Success page authz:
 * - Paid: stripe.checkout.sessions.retrieve(session_id) then load order
 * - Free: order_id + confirm token hash
 * Display: order id, event title, quantity, status, masked email — never phone.
 * Cache-Control: no-store (also set in next.config headers).
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id, order_id, token } = await searchParams;
  const view = await resolveSuccessView({
    sessionId: session_id,
    orderId: order_id,
    token,
  });

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg">
        {view.kind === "confirmed" ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              {view.processing
                ? "Payment received"
                : view.status === "paid" || view.status === "fulfilled"
                  ? "You're confirmed"
                  : "Order details"}
            </h1>
            {view.processing ? (
              <p className="mt-4 text-muted">
                Your payment went through. Finalizing your tickets. This page
                may update shortly. A confirmation email is on its way.
              </p>
            ) : (
              <p className="mt-4 text-muted">
                Thanks for supporting 96 Nation. Keep this confirmation for your
                records; a copy was sent by email when available.
              </p>
            )}
            <dl className="mt-6 space-y-3 rounded-lg border border-border bg-surface p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Order</dt>
                <dd className="font-mono text-fg">{view.orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Event</dt>
                <dd className="text-right font-medium text-fg">
                  {view.eventTitle}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Quantity</dt>
                <dd className="text-fg">{view.quantity}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Status</dt>
                <dd className="capitalize text-fg">
                  {view.processing ? "processing" : view.status}
                </dd>
              </div>
              {view.maskedEmail ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Email</dt>
                  <dd className="text-fg">{view.maskedEmail}</dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : view.kind === "processing" ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Payment processing
            </h1>
            <p className="mt-4 text-muted">{view.message}</p>
            {view.orderId ? (
              <p className="mt-2 font-mono text-sm text-fg">{view.orderId}</p>
            ) : null}
          </>
        ) : view.kind === "rate_limited" ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Please wait
            </h1>
            <p className="mt-4 text-muted">{view.message}</p>
          </>
        ) : view.kind === "unauthorized" ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Confirmation unavailable
            </h1>
            <p className="mt-4 text-muted">{view.message}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Thank you
            </h1>
            <p className="mt-4 text-muted">{view.message}</p>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/events">Browse events</ButtonLink>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-accent underline-offset-2 hover:underline"
          >
            Home
          </Link>
        </div>
      </div>
    </Container>
  );
}
