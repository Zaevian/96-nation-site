import type { Metadata } from "next";

import { FollowCallout } from "@/components/FollowCallout";
import { Container } from "@/components/ui/Container";
import { getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Galleries",
    description: "Photo galleries from 96 Nation shows and community events.",
    path: "/galleries",
    settings,
  });
}

export default function GalleriesPage() {
  // Full CMS gallery list ships with media PR wiring; empty state is intentional.
  const galleries: unknown[] = [];

  return (
    <Container className="py-12">
      <header className="max-w-2xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Nights captured
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-fg sm:text-4xl">
          Galleries
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-muted sm:text-lg">
          Photos from 96 Nation shows and community nights.
        </p>
      </header>

      {galleries.length === 0 ? (
        <FollowCallout
          className="mt-10"
          title="Galleries coming soon"
          description="Photo sets from recent nights are on the way. Until then, the freshest flicks live on our Instagram."
          secondaryHref="/events"
          secondaryLabel="Browse events"
        />
      ) : null}
    </Container>
  );
}
