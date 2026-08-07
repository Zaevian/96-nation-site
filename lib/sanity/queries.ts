import { cache } from "react";

import { sanityFetch } from "./client";
import type {
  CmsPage,
  EventDetail,
  EventListItem,
  EventShortLink,
  FeaturedEvent,
  SiteSettings,
} from "./types";

const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  siteTitle,
  tagline,
  logo,
  contactEmail,
  timezone,
  footerBlurb,
  socialLinks[]{ label, url, network },
  homeHeroTitle,
  homeHeroSubtitle,
  homeHeroImage,
  homeHeroCtaLabel,
  homeHeroCtaHref,
  aboutTitle,
  aboutBody,
  primaryNav[]{ label, href },
  defaultOgImage
}`;

const pageBySlugQuery = `*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  body,
  seo{
    metaTitle,
    metaDescription,
    ogImage
  }
}`;

/** Card projection shared by list + featured (timezone required for correct local times). */
const eventCardProjection = `{
  _id,
  title,
  "slug": slug.current,
  summary,
  startAt,
  endAt,
  timezone,
  status,
  heroImage,
  venue{ name, city },
  ticketTypes[]{ id, name, priceCents, capacity }
}`;

/** Upcoming published only (still ongoing if endAt is in the future). */
const featuredEventsQuery = `*[_type == "event" && status == "published" && defined(slug.current) && coalesce(endAt, startAt) >= now()]
  | order(startAt asc)[0...4]
  ${eventCardProjection}`;

/** All public events; page splits upcoming / past / cancelled. */
const eventsListQuery = `*[_type == "event" && status in ["published", "cancelled"] && defined(slug.current)]
  | order(startAt asc)
  ${eventCardProjection}`;

const eventBySlugQuery = `*[_type == "event" && slug.current == $slug && status in ["published", "cancelled"]][0]{
  _id,
  title,
  "slug": slug.current,
  shortCode,
  summary,
  body,
  startAt,
  endAt,
  timezone,
  status,
  heroImage,
  promoVideoUrl,
  venue,
  ticketTypes[]{
    id,
    name,
    description,
    priceCents,
    currency,
    capacity,
    maxPerOrder,
    salesStart,
    salesEnd
  },
  seo{
    metaTitle,
    metaDescription,
    ogImage
  }
}`;

/** Published/cancelled event by shortCode for /t/[code] redirects. Drafts never match. */
const eventByShortCodeQuery = `*[_type == "event" && shortCode == $code && status in ["published", "cancelled"] && defined(slug.current)][0]{
  "slug": slug.current,
  status
}`;

/** Singleton site settings (request-deduped via React cache). */
export const getSiteSettings = cache(
  async (): Promise<SiteSettings | null> => {
    return sanityFetch<SiteSettings>(siteSettingsQuery);
  },
);

/** Static CMS page by slug (request-deduped). */
export const getPageBySlug = cache(
  async (slug: string): Promise<CmsPage | null> => {
    return sanityFetch<CmsPage>(pageBySlugQuery, { slug });
  },
);

/** Upcoming published events for the home page featured strip. */
export const getFeaturedEvents = cache(
  async (): Promise<FeaturedEvent[]> => {
    const rows = await sanityFetch<FeaturedEvent[]>(featuredEventsQuery);
    return rows ?? [];
  },
);

/** Published + cancelled events for the list page (drafts excluded). */
export const getEvents = cache(async (): Promise<EventListItem[]> => {
  const rows = await sanityFetch<EventListItem[]>(eventsListQuery);
  return rows ?? [];
});

/** Published/cancelled event by slug (full detail). */
export const getEventBySlug = cache(
  async (slug: string): Promise<EventDetail | null> => {
    return sanityFetch<EventDetail>(eventBySlugQuery, { slug });
  },
);

/**
 * Resolve a public short code to an event slug.
 * Only published/cancelled events; drafts are not public.
 */
export const getEventByShortCode = cache(
  async (code: string): Promise<EventShortLink | null> => {
    if (!code) return null;
    return sanityFetch<EventShortLink>(eventByShortCodeQuery, { code });
  },
);
