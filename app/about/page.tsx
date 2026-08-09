import type { Metadata } from "next";

import { CmsPageView } from "@/components/CmsPageView";
import { PortableText } from "@/components/PortableText";
import { Container } from "@/components/ui/Container";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

const FALLBACK_DESCRIPTION =
  "96 Nation is a Tallahassee live events company putting on shows and backing local talent.";

const FALLBACK_ABOUT_PARAS = [
  "96 Nation is a live events company based in Tallahassee. We book and promote all-ages shows, sell tickets for the night, and keep a home base online so people can find the next date without hunting around.",
  "We're also a creative collective. Our focus is the local music and arts scene: getting artists on stage, capturing the night, and giving people a real place to plug in.",
  "Genesis is how we help local talent go further. Through Genesis we offer creative and media support, community signup, and a way to ask about production, booking, and related work.",
  "If you're an artist, a fan, or just looking for something to do on a weekend in Tallahassee, you're welcome here. Grab tickets when a show drops, poke around the gallery and videos, or reach out through Genesis or contact.",
];

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
      FALLBACK_DESCRIPTION,
    path: "/about",
    seo: page?.seo,
    settings,
  });
}

/**
 * About page: prefer dedicated CMS page (slug about),
 * else siteSettings about fields, else local fallback copy.
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
        fallbackDescription={FALLBACK_DESCRIPTION}
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
          <div className="mt-6 max-w-prose space-y-4 text-muted">
            {FALLBACK_ABOUT_PARAS.map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>
        )}
      </article>
    </Container>
  );
}
