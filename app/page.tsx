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
  title: "We put on the night.",
  subtitle:
    "Ticket hub for live music, run by 96 Nation, right here in Tallahassee.",
  ctaLabel: "View events",
  ctaHref: "/events",
  kicker: "Tallahassee · Live experiences",
};

const FALLBACK_ABOUT =
  "96 Nation creates experiences. All-ages shows, tickets in your pocket, and Genesis for local talent who want to level up. If you feel the night before it starts, you're already one of us.";

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
      <section aria-labelledby="featured-heading" className="mt-16 sm:mt-20">
        <h2
          id="featured-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-fg sm:text-3xl"
        >
          Upcoming events
        </h2>
        <EmptyState
          className="mt-6"
          title="Calendar's quiet for a second"
          description="When the next show drops, it'll land here first. Follow along or hit us up if you're hunting a date."
          actionHref="/events"
          actionLabel="View events"
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-heading" className="mt-16 sm:mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="featured-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-fg sm:text-3xl"
        >
          Upcoming events
        </h2>
        <Link
          href="/events"
          className="font-display text-sm font-semibold uppercase tracking-wide text-accent underline-offset-4 hover:underline"
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
  const aboutTitle = settings?.aboutTitle?.trim() || "Who we are";
  const hasAboutBody = Boolean(
    settings?.aboutBody && settings.aboutBody.length > 0,
  );

  return (
    <div className="brand-glow">
      <Container className="py-12 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl space-y-7">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent sm:text-sm">
              {kicker}
            </p>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <ButtonLink href={ctaHref}>{ctaLabel}</ButtonLink>
              <ButtonLink href="/genesis" variant="secondary">
                Genesis
              </ButtonLink>
              <ButtonLink href="/contact" variant="ghost">
                Contact
              </ButtonLink>
            </div>
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
              We are.
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
            {heroImageUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-surface shadow-[0_0_60px_-12px_color-mix(in_srgb,var(--accent)_50%,transparent)]">
                <Image
                  src={heroImageUrl}
                  alt={settings?.homeHeroImage?.alt || title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            ) : (
              <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl border border-border bg-surface/80 p-10 shadow-[0_0_80px_-10px_color-mix(in_srgb,var(--accent)_45%,transparent)]">
                <Image
                  src="/brand/96-nation-logo-white.png"
                  alt="96 Nation"
                  width={280}
                  height={350}
                  className="h-auto w-full max-w-[220px] object-contain sm:max-w-[260px]"
                  priority
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5"
                  aria-hidden
                />
              </div>
            )}
          </div>
        </div>

        <FeaturedEvents events={featured} />

        <section
          aria-labelledby="about-heading"
          className="mt-16 max-w-3xl border-t border-border pt-12 sm:mt-20"
        >
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            96 Nation
          </p>
          <h2
            id="about-heading"
            className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-fg sm:text-3xl"
          >
            {aboutTitle}
          </h2>
          {hasAboutBody ? (
            <div className="mt-5">
              <PortableText value={settings!.aboutBody} />
            </div>
          ) : (
            <p className="mt-5 max-w-prose text-base leading-relaxed text-muted sm:text-lg">
              {FALLBACK_ABOUT}
            </p>
          )}
          <p className="mt-6">
            <Link
              href="/about"
              className="font-display text-sm font-semibold uppercase tracking-wide text-accent underline-offset-4 hover:underline"
            >
              More about us
            </Link>
          </p>
        </section>
      </Container>
    </div>
  );
}
