import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { PortableText } from "@/components/PortableText";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  getFeaturedEvents,
  getSiteSettings,
} from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import { buildPageMetadata } from "@/lib/seo";
import type { EventListItem } from "@/lib/sanity/types";
import { sanitizeHrefOrFallback } from "@/lib/url";

const FALLBACK_HERO = {
  title: "96 Nation",
  subtitle:
    "Ticket hub for live music, run by 96 Nation, right here in Tallahassee.",
  ctaLabel: "View events",
  ctaHref: "/events",
  kicker: "Tallahassee live music",
};

const FALLBACK_ABOUT =
  "We're a Tallahassee live events crew. We put on all-ages shows, sell tickets for the night, and use Genesis to help local artists with creative and media work. If you're looking for the next show in town, start here.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: settings?.homeHeroTitle || settings?.siteTitle || "96 Nation",
    description:
      settings?.homeHeroSubtitle ||
      settings?.tagline ||
      FALLBACK_HERO.subtitle,
    path: "/",
    settings,
    absoluteTitle: true,
  });
}

function FeaturedEvents({ events }: { events: EventListItem[] }) {
  if (events.length === 0) {
    return (
      <section aria-labelledby="featured-heading" className="mt-16">
        <h2
          id="featured-heading"
          className="text-xl font-bold tracking-tight text-fg"
        >
          Upcoming events
        </h2>
        <EmptyState
          className="mt-4"
          title="Nothing on the calendar yet"
          description="New shows will show up here as soon as we announce them. Check back soon."
          actionHref="/events"
          actionLabel="View events"
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-heading" className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="featured-heading"
          className="text-xl font-bold tracking-tight text-fg"
        >
          Upcoming events
        </h2>
        <Link
          href="/events"
          className="text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <EventCard key={event._id} event={event} headingLevel={3} />
        ))}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  const [settings, featured] = await Promise.all([
    getSiteSettings(),
    getFeaturedEvents(),
  ]);

  const title =
    settings?.homeHeroTitle?.trim() || FALLBACK_HERO.title;
  const subtitle =
    settings?.homeHeroSubtitle?.trim() || FALLBACK_HERO.subtitle;
  const ctaLabel =
    settings?.homeHeroCtaLabel?.trim() || FALLBACK_HERO.ctaLabel;
  const ctaHref = sanitizeHrefOrFallback(
    settings?.homeHeroCtaHref,
    FALLBACK_HERO.ctaHref,
  );
  const kicker = settings?.tagline?.trim() || FALLBACK_HERO.kicker;
  const heroImageUrl = settings?.homeHeroImage
    ? urlForImage(settings.homeHeroImage)?.width(1400).height(800).url()
    : null;
  const aboutTitle =
    settings?.aboutTitle?.trim() || "Who we are";
  const hasAboutBody = Boolean(
    settings?.aboutBody && settings.aboutBody.length > 0,
  );

  return (
    <Container className="py-12 sm:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-wider text-accent">
            {kicker}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            {title}
          </h1>
          <p className="text-base text-muted sm:text-lg">{subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={ctaHref}>{ctaLabel}</ButtonLink>
            <ButtonLink href="/genesis" variant="secondary">
              Genesis
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              Contact
            </ButtonLink>
          </div>
        </div>

        {heroImageUrl ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-surface">
            <Image
              src={heroImageUrl}
              alt={settings?.homeHeroImage?.alt || title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        ) : null}
      </div>

      <FeaturedEvents events={featured} />

      <section aria-labelledby="about-heading" className="mt-16 max-w-3xl">
        <h2
          id="about-heading"
          className="text-xl font-bold tracking-tight text-fg"
        >
          {aboutTitle}
        </h2>
        {hasAboutBody ? (
          <div className="mt-4">
            <PortableText value={settings!.aboutBody} />
          </div>
        ) : (
          <p className="mt-4 max-w-prose text-muted">{FALLBACK_ABOUT}</p>
        )}
        <p className="mt-4">
          <Link
            href="/about"
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            More about us
          </Link>
        </p>
      </section>
    </Container>
  );
}
