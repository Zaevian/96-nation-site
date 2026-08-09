import Image from "next/image";
import type { Metadata } from "next";

import { CmsPageView } from "@/components/CmsPageView";
import { PortableText } from "@/components/PortableText";
import { Container } from "@/components/ui/Container";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

const FALLBACK_DESCRIPTION =
  "96 Nation creates experiences in Tallahassee. Live shows, tickets, and Genesis for local talent.";

const FALLBACK_ABOUT_PARAS = [
  "96 Nation is a company that creates experiences. We want lasting memories and feelings for everyone who interacts with the numbers. That starts with the brand, and it shows up on stage.",
  "We're a Tallahassee live events crew. All-ages shows, tickets for the night, and a home base online so you can find the next date without hunting around Instagram comments.",
  "We're also a creative collective. The focus is the local music and arts scene: getting artists on stage, capturing the night, and giving people a real place to plug in.",
  "Genesis is how we help local talent take the next step. Creative and media support, community signup, production and booking questions. If you're building something here, talk to us.",
  "If you're an artist, a fan, or just looking for something to do on a weekend in Tallahassee, you're welcome. Grab tickets when a show drops. Reach out through Genesis or contact when you need more than a ticket.",
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
    <Container className="py-12 sm:py-16">
      <article className="max-w-3xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          We are.
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
        {hasBody ? (
          <div className="mt-8">
            <PortableText value={settings!.aboutBody} />
          </div>
        ) : (
          <div className="mt-8 max-w-prose space-y-5 text-base leading-relaxed text-muted sm:text-lg">
            {FALLBACK_ABOUT_PARAS.map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
          </div>
        )}
        <div className="mt-12 flex items-center gap-6 border-t border-border pt-10">
          <Image
            src="/brand/96-nation-logo-white.png"
            alt=""
            width={80}
            height={100}
            className="h-20 w-auto object-contain opacity-90"
            aria-hidden
          />
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
            Tallahassee · Live experiences
          </p>
        </div>
      </article>
    </Container>
  );
}
