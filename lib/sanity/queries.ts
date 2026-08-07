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

/** Singleton site settings, or null when unconfigured / empty. */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityFetch<SiteSettings>(siteSettingsQuery);
}

/** Static CMS page by slug (`privacy`, `terms`, `about`, `genesis`, …). */
export async function getPageBySlug(slug: string): Promise<CmsPage | null> {
  return sanityFetch<CmsPage>(pageBySlugQuery, { slug });
}

/** Upcoming published events for the home page featured strip. */
export async function getFeaturedEvents(): Promise<FeaturedEvent[]> {
  const rows = await sanityFetch<FeaturedEvent[]>(featuredEventsQuery);
  return rows ?? [];
}
