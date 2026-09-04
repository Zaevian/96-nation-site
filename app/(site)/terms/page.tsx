import type { Metadata } from "next";

import { CmsPageView } from "@/components/CmsPageView";
import { TermsOfUseContent } from "@/components/legal/TermsOfUseContent";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("terms"),
    getSiteSettings(),
  ]);
  return buildPageMetadata({
    title: page?.title || "Terms of Use",
    description:
      page?.seo?.metaDescription ||
      "Terms of use for 96 Nation ticketing, RSVPs, refunds, and community services.",
    path: "/terms",
    seo: page?.seo,
    settings,
  });
}

export default async function TermsPage() {
  const page = await getPageBySlug("terms");
  const hasCmsBody = Boolean(page?.body && page.body.length > 0);

  return (
    <CmsPageView
      page={page}
      fallbackTitle="Terms of Use"
      fallbackDescription=""
      forceFallback={!hasCmsBody}
    >
      {!hasCmsBody ? <TermsOfUseContent /> : null}
    </CmsPageView>
  );
}
