import type { Metadata } from "next";

import { EmptyState } from "@/components/EmptyState";
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
        <h1 className="text-3xl font-bold tracking-tight text-fg">Galleries</h1>
        <p className="mt-4 max-w-prose text-muted">
          Photos from 96 Nation shows and community nights.
        </p>
      </header>

      {galleries.length === 0 ? (
        <EmptyState
          title="Galleries coming soon"
          description="We're loading up photo sets from recent nights. In the meantime, browse events or check videos."
          actionHref="/events"
          actionLabel="Browse events"
        />
      ) : null}
    </Container>
  );
}
