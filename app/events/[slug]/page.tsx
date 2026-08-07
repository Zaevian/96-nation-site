import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/Container";
import { getEventBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import { buildPageMetadata } from "@/lib/seo";

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

  return buildPageMetadata({
    title: event.title,
    description: event.summary || `Event: ${event.title}`,
    path: `/events/${event.slug}`,
    settings,
    seo: event.heroImage
      ? { ogImage: event.heroImage, metaTitle: null, metaDescription: null }
      : null,
  });
}

/**
 * Minimal event detail stub so home featured cards resolve before PR 5
 * (full tickets / body / checkout). Without Sanity, notFound.
 */
export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const imageUrl = event.heroImage
    ? urlForImage(event.heroImage)?.width(1200).height(630).url()
    : null;
  const cancelled = event.status === "cancelled";

  let dateLabel: string | null = null;
  if (event.startAt) {
    try {
      dateLabel = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
      }).format(new Date(event.startAt));
    } catch {
      dateLabel = null;
    }
  }

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

        {cancelled ? (
          <p
            className="mb-3 inline-block rounded-md border border-danger/40 bg-danger/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-danger"
            role="status"
          >
            Cancelled
          </p>
        ) : null}

        <h1 className="text-3xl font-bold tracking-tight text-fg">
          {event.title}
        </h1>

        {dateLabel ? (
          <p className="mt-2 text-sm font-medium text-accent">{dateLabel}</p>
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
        ) : (
          <p className="mt-6 max-w-prose text-muted">
            Event details and ticket checkout will expand in a later release.
          </p>
        )}
      </article>
    </Container>
  );
}
