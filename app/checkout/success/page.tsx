import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

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
 * Minimal success stub for PR 9a.
 * Full Stripe session verification + order display lands in PR 9b.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id, order_id, token } = await searchParams;
  const hasPaidHint = Boolean(session_id);
  const hasFreeHint = Boolean(order_id);

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {hasFreeHint && !hasPaidHint ? "RSVP received" : "Thank you"}
        </h1>

        {hasPaidHint ? (
          <p className="mt-4 text-muted">
            Payment is processing. Check your email for your ticket confirmation
            shortly. If you closed the payment window early, open the link from
            your email when it arrives.
          </p>
        ) : hasFreeHint ? (
          <p className="mt-4 text-muted">
            Your RSVP is confirmed
            {token ? "" : " if you completed the form"}. Check your email for a
            confirmation link
            {order_id ? (
              <>
                {" "}
                (order <span className="font-mono text-sm text-fg">{order_id}</span>
                )
              </>
            ) : null}
            .
          </p>
        ) : (
          <p className="mt-4 text-muted">
            If you just completed checkout or an RSVP, check your email for
            confirmation. This page does not show order details without a valid
            session or token (full verification arrives in a follow-up release).
          </p>
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
