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

export type FeaturedEvent = {
  _id: string;
  title: string;
  slug: string;
  summary?: string | null;
  startAt?: string | null;
  status?: string | null;
  heroImage?: SanityImage | null;
};
