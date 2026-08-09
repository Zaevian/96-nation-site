import type { Metadata } from "next";

import { urlForImage } from "@/lib/sanity/image";
import type { SanityImage, SeoFields, SiteSettings } from "@/lib/sanity/types";

const DEFAULT_SITE_TITLE = "96 Nation";
const DEFAULT_DESCRIPTION =
  "Ticket hub for live music, run by 96 Nation, right here in Tallahassee.";

/** Absolute site origin (no trailing slash). */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

function resolveOgImageUrl(
  pageImage?: SanityImage | null,
  defaultImage?: SanityImage | null,
): string | undefined {
  const source = pageImage || defaultImage;
  if (!source) return undefined;
  try {
    return (
      urlForImage(source)?.width(1200).height(630).fit("crop").url() ||
      undefined
    );
  } catch {
    return undefined;
  }
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
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: resolvedTitle,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: resolvedTitle,
      description: resolvedDescription,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
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
      ...(ogImageUrl
        ? {
            images: [{ url: ogImageUrl, width: 1200, height: 630 }],
          }
        : {}),
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: siteTitle,
      description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  };
}
