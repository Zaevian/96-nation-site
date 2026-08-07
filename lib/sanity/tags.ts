/**
 * Cache tags for Sanity-backed content.
 * POST /api/revalidate maps webhook type → these tags.
 */

export const SANITY_TAGS = {
  /** All event list/detail/short-link queries */
  events: "events",
  /** Singleton site settings (nav, home, about, OG) */
  siteSettings: "site-settings",
  /** All CMS pages (privacy, terms, etc.) */
  pages: "pages",
  /** Galleries list/detail */
  galleries: "galleries",
  /** Videos list/detail */
  videos: "videos",
} as const;

export type SanityTag = (typeof SANITY_TAGS)[keyof typeof SANITY_TAGS];

/** Tag a single event by slug (used with events collection tag). */
export function eventTag(slug: string): string {
  return `event:${slug}`;
}

/** Tag a CMS page by slug. */
export function pageTag(slug: string): string {
  return `page:${slug}`;
}

/**
 * Map a Sanity document `_type` (and optional slug) to cache tags to revalidate.
 */
export function tagsForSanityType(
  type: string | undefined | null,
  slug?: string | null,
): string[] {
  const tags = new Set<string>();

  switch (type) {
    case "event":
      tags.add(SANITY_TAGS.events);
      if (slug) tags.add(eventTag(slug));
      break;
    case "siteSettings":
      tags.add(SANITY_TAGS.siteSettings);
      break;
    case "page":
      tags.add(SANITY_TAGS.pages);
      if (slug) tags.add(pageTag(slug));
      break;
    case "gallery":
      tags.add(SANITY_TAGS.galleries);
      break;
    case "video":
      tags.add(SANITY_TAGS.videos);
      break;
    case "formConfig":
      // Form chrome is lightly used; revalidate pages that may show it.
      tags.add(SANITY_TAGS.pages);
      break;
    default:
      // Unknown / missing type: revalidate common public surfaces.
      tags.add(SANITY_TAGS.events);
      tags.add(SANITY_TAGS.siteSettings);
      tags.add(SANITY_TAGS.pages);
      tags.add(SANITY_TAGS.galleries);
      tags.add(SANITY_TAGS.videos);
      break;
  }

  return Array.from(tags);
}

/** All known collection tags (full content purge). */
export function allSanityTags(): string[] {
  return Object.values(SANITY_TAGS);
}
