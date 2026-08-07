import type { Metadata } from "next";

import { CmsPageView } from "@/components/CmsPageView";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("privacy"),
    getSiteSettings(),
  ]);
  return buildPageMetadata({
    title: page?.title || "Privacy",
    description:
      page?.seo?.metaDescription ||
      "Privacy policy for 96 Nation ticketing and community services.",
    path: "/privacy",
    seo: page?.seo,
    settings,
  });
}

export default async function PrivacyPage() {
  const page = await getPageBySlug("privacy");
  return (
    <CmsPageView
      page={page}
      fallbackTitle="Privacy"
      fallbackDescription="Privacy policy placeholder. Full policy content will ship with the handoff package, or can be authored as a Page with slug “privacy” in Sanity Studio."
    />
  );
}
