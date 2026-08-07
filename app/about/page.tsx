import type { Metadata } from "next";

import { CmsPageView } from "@/components/CmsPageView";
import { PortableText } from "@/components/PortableText";
import { Container } from "@/components/ui/Container";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("about"),
    getSiteSettings(),
  ]);
  return buildPageMetadata({
    title: page?.title || settings?.aboutTitle || "About",
    description:
      page?.seo?.metaDescription ||
      settings?.tagline ||
      "About 96 Nation — local music, tickets, and Genesis.",
    path: "/about",
    seo: page?.seo,
    settings,
  });
}

/**
 * About page: prefer dedicated CMS `page` (slug `about`),
 * else siteSettings about fields, else stub.
 */
export default async function AboutPage() {
  const [page, settings] = await Promise.all([
    getPageBySlug("about"),
    getSiteSettings(),
  ]);

  if (page) {
    return (
      <CmsPageView
        page={page}
        fallbackTitle="About 96 Nation"
        fallbackDescription="About 96 Nation."
      />
    );
  }

  const title = settings?.aboutTitle?.trim() || "About 96 Nation";
  const hasBody = Boolean(settings?.aboutBody && settings.aboutBody.length > 0);

  return (
    <Container className="py-12">
      <article className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{title}</h1>
        {hasBody ? (
          <div className="mt-6">
            <PortableText value={settings!.aboutBody} />
          </div>
        ) : (
          <p className="mt-4 max-w-prose text-muted">
            96 Nation is a Tallahassee-area music hub for all-ages shows,
            ticketing, galleries, and Genesis community forms. Connect a Sanity
            project and edit Site Settings or a Page with slug “about” to replace
            this stub.
          </p>
        )}
      </article>
    </Container>
  );
}
