import { cache } from "react";

import { sanityFetch } from "./client";
import type { CmsPage, FeaturedEvent, SiteSettings } from "./types";

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

const featuredEventsQuery = `*[_type == "event" && status == "published" && defined(slug.current)]
  | order(startAt asc)[0...4]{
    _id,
    title,
    "slug": slug.current,
    summary,
    startAt,
    status,
    heroImage
  }`;

const eventBySlugQuery = `*[_type == "event" && slug.current == $slug && status in ["published", "cancelled"]][0]{
  _id,
  title,
  "slug": slug.current,
  summary,
  startAt,
  status,
  heroImage
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

/** Published/cancelled event by slug (stub detail until full PR 5). */
export const getEventBySlug = cache(
  async (slug: string): Promise<FeaturedEvent | null> => {
    return sanityFetch<FeaturedEvent>(eventBySlugQuery, { slug });
  },
);
