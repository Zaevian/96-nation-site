import type { Metadata } from "next";

import { CmsPageView } from "@/components/CmsPageView";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("privacy"),
    getSiteSettings(),
  ]);
  return buildPageMetadata({
    title: page?.title || "Privacy Policy",
    description:
      page?.seo?.metaDescription ||
      "Privacy policy for 96 Nation ticketing and community services — what we collect, how we use Stripe, retention, and your rights.",
    path: "/privacy",
    seo: page?.seo,
    settings,
  });
}

export default async function PrivacyPage() {
  const page = await getPageBySlug("privacy");
  const hasCmsBody = Boolean(page?.body && page.body.length > 0);

  return (
    <CmsPageView
      page={page}
      fallbackTitle="Privacy Policy"
      fallbackDescription=""
      // When CMS has no body, render the full legal template instead of a stub.
      forceFallback={!hasCmsBody}
    >
      {!hasCmsBody ? <PrivacyPolicyContent /> : null}
    </CmsPageView>
  );
}
