import type { PortableTextBlock } from "@portabletext/types";

/** Minimal Sanity image shape used for urlForImage + alt. */
export type SanityImage = {
  _type?: "image";
  asset?: { _ref?: string; _type?: "reference"; url?: string };
  alt?: string;
  caption?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
};

export type SeoFields = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: SanityImage | null;
};

export type SiteSettings = {
  siteTitle?: string | null;
  tagline?: string | null;
  logo?: SanityImage | null;
  contactEmail?: string | null;
  timezone?: string | null;
  footerBlurb?: string | null;
  socialLinks?: {
    label?: string | null;
    url?: string | null;
    network?: string | null;
  }[] | null;
  homeHeroTitle?: string | null;
  homeHeroSubtitle?: string | null;
  homeHeroImage?: SanityImage | null;
  homeHeroCtaLabel?: string | null;
  homeHeroCtaHref?: string | null;
  aboutTitle?: string | null;
  aboutBody?: PortableTextBlock[] | null;
  primaryNav?: { label?: string | null; href?: string | null }[] | null;
  defaultOgImage?: SanityImage | null;
};

export type CmsPage = {
  _id: string;
  title: string;
  slug: string;
  body?: PortableTextBlock[] | null;
  seo?: SeoFields | null;
};

export type EventVenue = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  mapUrl?: string | null;
};

export type EventTicketType = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  currency?: string | null;
  capacity: number;
  maxPerOrder?: number | null;
  salesStart?: string | null;
  salesEnd?: string | null;
};

/** Card / list row for published + cancelled events. */
export type EventListItem = {
  _id: string;
  title: string;
  slug: string;
  summary?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
  status?: string | null;
  heroImage?: SanityImage | null;
  venue?: Pick<EventVenue, "name" | "city"> | null;
  /** Sanity-only capacity until Supabase inventory lands. */
  ticketTypes?: Pick<
    EventTicketType,
    "id" | "name" | "priceCents" | "capacity"
  >[] | null;
};

/** Home featured strip; same shape as list cards. */
export type FeaturedEvent = EventListItem;

/** Full event for detail page. */
export type EventDetail = {
  _id: string;
  title: string;
  slug: string;
  shortCode?: string | null;
  summary?: string | null;
  body?: PortableTextBlock[] | null;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
  status?: string | null;
  heroImage?: SanityImage | null;
  promoVideoUrl?: string | null;
  venue?: EventVenue | null;
  ticketTypes?: EventTicketType[] | null;
  seo?: SeoFields | null;
};

/** Short-link lookup result. */
export type EventShortLink = {
  slug: string;
  status?: string | null;
};
