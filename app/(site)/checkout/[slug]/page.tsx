import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/Container";
import { formatEventDateLong, formatPriceCents, isTicketOnSale } from "@/lib/events";
import {
  getFacilityFeeCents,
  isTicketingEnabled,
} from "@/lib/env/ticketing";
import { getEventBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

import { CheckoutForm } from "./CheckoutForm";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
};

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [event, settings] = await Promise.all([
    getEventBySlug(slug),
    getSiteSettings(),
  ]);

  return buildPageMetadata({
    title: event ? `Checkout: ${event.title}` : "Checkout",
    description: event
      ? `Get tickets for ${event.title}`
      : "Checkout",
    path: `/checkout/${slug}`,
    settings,
  });
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { slug } = await params;
  const { type: ticketTypeId } = await searchParams;

  const event = await getEventBySlug(slug);
  if (!event || event.status === "cancelled") {
    notFound();
  }

  const tickets = event.ticketTypes ?? [];
  const ticket =
    (ticketTypeId
      ? tickets.find((t) => t.id === ticketTypeId)
      : tickets[0]) ?? null;

  if (!ticket) {
    notFound();
  }

  const ticketingEnabled = isTicketingEnabled();
  const facilityFeeCents =
    ticket.priceCents > 0 ? getFacilityFeeCents() : 0;
  const onSale = isTicketOnSale(ticket);
  const tz = event.timezone || "America/New_York";
  const dateLabel = formatEventDateLong(event.startAt, tz);
  const isFree = ticket.priceCents === 0;

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg">
        <p className="mb-4">
          <Link
            href={`/events/${event.slug}`}
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            ← Back to event
          </Link>
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {isFree ? "RSVP" : "Checkout"}
        </h1>
        <p className="mt-1 text-muted">{event.title}</p>
        {dateLabel ? (
          <p className="mt-1 text-sm text-muted">
            <time dateTime={event.startAt || undefined}>{dateLabel}</time>
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          {ticket.name}
          {" · "}
          {isFree ? "Free" : formatPriceCents(ticket.priceCents)}
          {ticket.maxPerOrder
            ? ` · max ${ticket.maxPerOrder} per order`
            : null}
        </p>

        {!onSale ? (
          <p
            className="mt-6 rounded-lg border border-border bg-surface p-4 text-muted"
            role="status"
          >
            This ticket type is not currently on sale.
          </p>
        ) : (
          <div className="mt-8">
            <CheckoutForm
              eventSlug={event.slug}
              eventTitle={event.title}
              ticket={{
                id: ticket.id,
                name: ticket.name,
                priceCents: ticket.priceCents,
                maxPerOrder: ticket.maxPerOrder ?? 10,
                description: ticket.description,
              }}
              facilityFeeCents={facilityFeeCents}
              ticketingEnabled={ticketingEnabled}
            />
          </div>
        )}
      </div>
    </Container>
  );
}
