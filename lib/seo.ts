import type { Metadata } from "next";

import { urlForImage } from "@/lib/sanity/image";
import type { SanityImage, SeoFields, SiteSettings } from "@/lib/sanity/types";
import { getSiteUrl } from "@/lib/site-url";

const DEFAULT_SITE_TITLE = "96 Nation";
const DEFAULT_DESCRIPTION =
  "Ticket hub for live music, run by 96 Nation, right here in Tallahassee. Experiences, shows, and Genesis.";

export { getSiteUrl } from "@/lib/site-url";

/** Static brand OG fallback when CMS has no default image. */
const STATIC_OG_IMAGE_PATH = "/brand/96-nation-logo-white.png";

function resolveOgImageUrl(
  pageImage?: SanityImage | null,
  defaultImage?: SanityImage | null,
): string {
  const source = pageImage || defaultImage;
  if (source) {
    try {
      const fromCms =
        urlForImage(source)?.width(1200).height(630).fit("crop").url() ||
        undefined;
      if (fromCms) return fromCms;
    } catch {
      // fall through to static brand asset
    }
  }
  return `${getSiteUrl()}${STATIC_OG_IMAGE_PATH}`;
}

export type BuildMetadataInput = {
  /** Document title (used in template as `%s · 96 Nation`). */
  title?: string | null;
  description?: string | null;
  /** Path beginning with `/` for canonical + OG url. */
  path?: string;
  seo?: SeoFields | null;
  settings?: SiteSettings | null;
  /** Force absolute title (home page). */
  absoluteTitle?: boolean;
};

/**
 * Build Next.js Metadata with Open Graph + Twitter cards.
 * Works without Sanity credentials (falls back to static defaults).
 */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  seo,
  settings,
  absoluteTitle = false,
}: BuildMetadataInput): Metadata {
  const siteTitle = settings?.siteTitle?.trim() || DEFAULT_SITE_TITLE;
  const resolvedTitle =
    seo?.metaTitle?.trim() || title?.trim() || siteTitle;
  const resolvedDescription =
    seo?.metaDescription?.trim() ||
    description?.trim() ||
    settings?.tagline?.trim() ||
    DEFAULT_DESCRIPTION;

  const ogImageUrl = resolveOgImageUrl(
    seo?.ogImage,
    settings?.defaultOgImage,
  );
  const canonical = `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const metadata: Metadata = {
    title: absoluteTitle
      ? { absolute: resolvedTitle }
      : resolvedTitle === siteTitle
        ? { absolute: siteTitle }
        : resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical,
      siteName: siteTitle,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [ogImageUrl],
    },
  };

  return metadata;
}

/** Default root layout metadata (static fallbacks + optional CMS). */
export async function buildRootMetadata(
  settings: SiteSettings | null,
): Promise<Metadata> {
  const siteTitle = settings?.siteTitle?.trim() || DEFAULT_SITE_TITLE;
  const description =
    settings?.tagline?.trim() || DEFAULT_DESCRIPTION;
  const ogImageUrl = resolveOgImageUrl(null, settings?.defaultOgImage);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: siteTitle,
      template: `%s · ${siteTitle}`,
    },
    description,
    openGraph: {
      type: "website",
      siteName: siteTitle,
      title: siteTitle,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: siteTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: [ogImageUrl],
    },
  };
}
