import type { Metadata } from "next";

import { CmsPageView } from "@/components/CmsPageView";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("genesis"),
    getSiteSettings(),
  ]);
  return buildPageMetadata({
    title: page?.title || "Genesis",
    description:
      page?.seo?.metaDescription ||
      "96 Nation: Genesis — signups, service inquiries, and community forms.",
    path: "/genesis",
    seo: page?.seo,
    settings,
  });
}

export default async function GenesisPage() {
  const page = await getPageBySlug("genesis");
  return (
    <CmsPageView
      page={page}
      fallbackTitle="96 Nation: Genesis"
      fallbackDescription="Signups, service inquiries, and community forms will live here. Author long-form intro copy as a Page with slug “genesis” in Sanity Studio; form UI ships in a later PR."
    />
  );
}
