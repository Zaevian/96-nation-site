import Image from "next/image";
import Link from "next/link";

import { EventStatusBadge } from "@/components/EventStatusBadge";
import {
  formatEventDate,
  formatPriceCents,
  isSoldOutFromCapacity,
  lowestPriceCents,
} from "@/lib/events";
import { urlForImage } from "@/lib/sanity/image";
import type { EventListItem } from "@/lib/sanity/types";

type EventCardProps = {
  event: EventListItem;
  /** Heading level for card title (default 2 on list; use 3 under a section h2). */
  headingLevel?: 2 | 3;
};

export function EventCard({ event, headingLevel = 2 }: EventCardProps) {
  const tz = event.timezone || "America/New_York";
  const dateLabel = formatEventDate(event.startAt, tz);
  const imageUrl = event.heroImage
    ? urlForImage(event.heroImage)?.width(640).height(360).url()
    : null;
  const soldOut = isSoldOutFromCapacity(event.ticketTypes);
  const cancelled = event.status === "cancelled";
  const price = lowestPriceCents(event.ticketTypes);
  const venueLabel = [event.venue?.name, event.venue?.city]
    .filter(Boolean)
    .join(" · ");
  const TitleTag = headingLevel === 3 ? "h3" : "h2";

  return (
    <li>
      <Link
        href={`/events/${event.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface no-underline transition-colors hover:border-accent/60"
      >
        {imageUrl ? (
          <div className="relative aspect-[16/9] w-full bg-bg">
            <Image
              src={imageUrl}
              alt={event.heroImage?.alt || event.title}
              fill
              className="object-cover transition-opacity group-hover:opacity-90"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            {cancelled || soldOut ? (
              <div className="absolute left-3 top-3">
                <EventStatusBadge status={event.status} soldOut={soldOut} />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-2 p-4">
          {!imageUrl && (cancelled || soldOut) ? (
            <EventStatusBadge status={event.status} soldOut={soldOut} />
          ) : null}

          {dateLabel ? (
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              {dateLabel}
            </p>
          ) : null}

          <TitleTag className="font-display text-lg font-bold uppercase tracking-tight text-fg group-hover:text-accent">
            {event.title}
          </TitleTag>

          {venueLabel ? (
            <p className="text-sm text-muted">{venueLabel}</p>
          ) : null}

          {event.summary ? (
            <p className="line-clamp-2 text-sm text-muted">{event.summary}</p>
          ) : null}

          {price !== null && !cancelled ? (
            <p className="mt-auto pt-2 text-sm font-medium text-fg">
              {soldOut
                ? "Sold out"
                : price === 0
                  ? "Free"
                  : `From ${formatPriceCents(price)}`}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
