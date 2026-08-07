import type { Metadata } from "next";

import { CmsPageView } from "@/components/CmsPageView";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("terms"),
    getSiteSettings(),
  ]);
  return buildPageMetadata({
    title: page?.title || "Terms",
    description:
      page?.seo?.metaDescription ||
      "Terms of use for 96 Nation ticketing and community services.",
    path: "/terms",
    seo: page?.seo,
    settings,
  });
}

export default async function TermsPage() {
  const page = await getPageBySlug("terms");
  return (
    <CmsPageView
      page={page}
      fallbackTitle="Terms"
      fallbackDescription="Terms of use placeholder. Full terms will ship with the handoff package, or can be authored as a Page with slug “terms” in Sanity Studio."
    />
  );
}
