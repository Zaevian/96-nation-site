import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { EventCard } from "@/components/EventCard";
import { FollowCallout } from "@/components/FollowCallout";
import { InstagramIcon } from "@/components/InstagramIcon";
import { PortableText } from "@/components/PortableText";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { isEventUpcoming } from "@/lib/events";
import {
  getEvents,
  getFeaturedEvents,
  getSiteSettings,
} from "@/lib/sanity/queries";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/social";
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

function FeaturedEvents({
  events,
  lastShow,
}: {
  events: EventListItem[];
  lastShow: EventListItem | null;
}) {
  if (events.length === 0) {
    return (
      <section aria-labelledby="featured-heading" className="mt-16 sm:mt-20">
        <h2
          id="featured-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-fg sm:text-3xl"
        >
          Upcoming events
        </h2>
        <div
          className={
            lastShow
              ? "mt-6 grid items-stretch gap-6 md:grid-cols-[1.15fr_0.85fr]"
              : "mt-6"
          }
        >
          <FollowCallout
            title="Calendar's quiet for a second"
            description="The next show drops on Instagram first, then lands here with tickets. Follow so you're on the list when it does."
            secondaryHref="/events"
            secondaryLabel="All events"
          />
          {lastShow ? (
            <div>
              <p className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Last time out
              </p>
              <ul>
                <EventCard event={lastShow} headingLevel={3} past />
              </ul>
            </div>
          ) : null}
        </div>
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
      <ul
        className={
          events.length === 1
            ? "mx-auto mt-6 grid max-w-md gap-4 sm:max-w-lg"
            : "mt-6 grid gap-4 sm:grid-cols-2"
        }
      >
        {events.map((event) => (
          <EventCard key={event._id} event={event} headingLevel={3} />
        ))}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  const [settings, featured, allEvents] = await Promise.all([
    getSiteSettings(),
    getFeaturedEvents(),
    getEvents(),
  ]);
  const now = new Date();
  const lastShow =
    allEvents
      .filter((e) => e.status !== "cancelled" && !isEventUpcoming(e, now))
      .sort((a, b) => {
        const ta = a.startAt ? new Date(a.startAt).getTime() : 0;
        const tb = b.startAt ? new Date(b.startAt).getTime() : 0;
        return tb - ta;
      })[0] ?? null;

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
              <ButtonLink href={INSTAGRAM_URL} variant="secondary">
                <InstagramIcon className="h-4 w-4" />
                Follow {INSTAGRAM_HANDLE}
              </ButtonLink>
              <ButtonLink href="/genesis" variant="ghost">
                Genesis
              </ButtonLink>
            </div>
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
              We are.
            </p>
          </div>

          <div
            className={`relative mx-auto w-full max-w-md items-center justify-center lg:max-w-none ${
              heroImageUrl ? "flex" : "hidden lg:flex"
            }`}
          >
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
              <div className="relative flex w-full max-w-sm items-center justify-center">
                <Image
                  src="/brand/96-nation-logo-white.png"
                  alt="96 Nation"
                  width={320}
                  height={320}
                  className="h-auto w-full max-w-[240px] object-contain drop-shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_35%,transparent)] sm:max-w-[280px]"
                  priority
                />
              </div>
            )}
          </div>
        </div>

        <FeaturedEvents events={featured} lastShow={lastShow} />

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
