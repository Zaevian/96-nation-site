import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventStatusBadge } from "@/components/EventStatusBadge";
import { PortableText } from "@/components/PortableText";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  checkoutHref,
  formatEventDateLong,
  formatPriceCents,
  isSoldOutFromCapacity,
  isTicketOnSale,
} from "@/lib/events";
import { getEventBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import { buildPageMetadata } from "@/lib/seo";
import { sanitizeHref } from "@/lib/url";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [event, settings] = await Promise.all([
    getEventBySlug(slug),
    getSiteSettings(),
  ]);

  if (!event) {
    return buildPageMetadata({
      title: "Event",
      path: `/events/${slug}`,
      settings,
    });
  }

  // Prefer CMS SEO OG, then hero image (share cards per event).
  const ogImage = event.seo?.ogImage || event.heroImage || null;

  return buildPageMetadata({
    title: event.seo?.metaTitle || event.title,
    description:
      event.seo?.metaDescription ||
      event.summary ||
      `Event: ${event.title}`,
    path: `/events/${event.slug}`,
    settings,
    seo: {
      metaTitle: event.seo?.metaTitle ?? null,
      metaDescription: event.seo?.metaDescription ?? null,
      ogImage,
    },
  });
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const tz = event.timezone || "America/New_York";
  const imageUrl = event.heroImage
    ? urlForImage(event.heroImage)?.width(1200).height(630).url()
    : null;
  const cancelled = event.status === "cancelled";
  const soldOut = isSoldOutFromCapacity(event.ticketTypes);
  const dateLabel = formatEventDateLong(event.startAt, tz);
  const endLabel = formatEventDateLong(event.endAt, tz);
  const mapUrl = sanitizeHref(event.venue?.mapUrl);
  const ticketTypes = event.ticketTypes ?? [];
  const hasBody = Boolean(event.body && event.body.length > 0);
  const promoUrl = sanitizeHref(event.promoVideoUrl);

  return (
    <Container className="py-12">
      <article className="max-w-3xl">
        <p className="mb-4">
          <Link
            href="/events"
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            ← All events
          </Link>
        </p>

        {(cancelled || soldOut) && (
          <div className="mb-3">
            <EventStatusBadge status={event.status} soldOut={soldOut} />
          </div>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-fg">
          {event.title}
        </h1>

        {dateLabel ? (
          <p className="mt-2 text-sm font-medium text-accent">
            <time dateTime={event.startAt || undefined}>{dateLabel}</time>
            {endLabel ? (
              <span className="text-muted">
                {" "}
                – <time dateTime={event.endAt || undefined}>{endLabel}</time>
              </span>
            ) : null}
          </p>
        ) : null}

        {event.venue?.name || event.venue?.address || event.venue?.city ? (
          <div className="mt-3 text-sm text-muted">
            {event.venue.name ? (
              <p className="font-medium text-fg">{event.venue.name}</p>
            ) : null}
            {event.venue.address ? <p>{event.venue.address}</p> : null}
            {event.venue.city ? <p>{event.venue.city}</p> : null}
            {mapUrl ? (
              <p className="mt-1">
                <a
                  href={mapUrl}
                  className="text-accent underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        {imageUrl ? (
          <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-surface">
            <Image
              src={imageUrl}
              alt={event.heroImage?.alt || event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        ) : null}

        {event.summary ? (
          <p className="mt-6 max-w-prose text-base text-muted">{event.summary}</p>
        ) : null}

        {hasBody ? (
          <div className="mt-6">
            <PortableText value={event.body} />
          </div>
        ) : null}

        {promoUrl ? (
          <p className="mt-6">
            <a
              href={promoUrl}
              className="text-sm font-medium text-accent underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch promo video
            </a>
          </p>
        ) : null}

        <section
          aria-labelledby="tickets-heading"
          className="mt-10 border-t border-border pt-8"
        >
          <h2
            id="tickets-heading"
            className="text-xl font-bold tracking-tight text-fg"
          >
            Tickets
          </h2>

          {cancelled ? (
            <p className="mt-3 max-w-prose text-muted" role="status">
              This event has been cancelled. Tickets are no longer available.
            </p>
          ) : soldOut ? (
            <p className="mt-3 max-w-prose text-muted" role="status">
              This event is sold out.
            </p>
          ) : ticketTypes.length === 0 ? (
            <p className="mt-3 max-w-prose text-muted">
              Ticket types will appear here when the event is fully configured.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ticketTypes.map((ticket) => {
                const onSale = isTicketOnSale(ticket);
                const typeSoldOut =
                  typeof ticket.capacity === "number" && ticket.capacity <= 0;
                const priceLabel =
                  ticket.priceCents === 0
                    ? "Free"
                    : formatPriceCents(ticket.priceCents);
                const canBuy = onSale && !typeSoldOut;
                const href = checkoutHref(event.slug, ticket.id);

                return (
                  <li
                    key={ticket.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-fg">{ticket.name}</p>
                      {ticket.description ? (
                        <p className="mt-1 text-sm text-muted">
                          {ticket.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm text-muted">
                        {priceLabel}
                        {typeof ticket.capacity === "number" ? (
                          <span>
                            {" "}
                            · Cap {ticket.capacity}
                            <span className="sr-only">
                              {" "}
                              (Sanity capacity; live inventory later)
                            </span>
                          </span>
                        ) : null}
                        {typeSoldOut ? (
                          <span className="font-medium text-muted">
                            {" "}
                            · Sold out
                          </span>
                        ) : null}
                        {!onSale && !typeSoldOut ? (
                          <span className="font-medium text-muted">
                            {" "}
                            · Not on sale
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {canBuy ? (
                      <ButtonLink
                        href={href}
                        className="w-full shrink-0 sm:w-auto"
                      >
                        {ticket.priceCents === 0 ? "RSVP" : "Buy tickets"}
                      </ButtonLink>
                    ) : (
                      <span className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted">
                        {typeSoldOut ? "Sold out" : "Not on sale"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </article>
    </Container>
  );
}
