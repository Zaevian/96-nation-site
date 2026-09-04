import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Payment cancelled",
    description: "Your payment was cancelled. You have not been charged.",
    path: "/checkout/cancel",
    settings,
  });
}

/**
 * Informational only — does NOT release inventory.
 * Capacity frees on Stripe session expiry (30m), expired webhook, or cron.
 */
export default function CheckoutCancelPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Payment cancelled
        </h1>
        <p className="mt-4 text-muted">
          You have not been charged. Your card was not charged for this order.
        </p>
        <p className="mt-3 text-sm text-muted">
          If you started checkout, a temporary hold on tickets may free up within
          about 30 minutes if you do not complete payment. You can return to the
          event page anytime to try again.
        </p>
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
