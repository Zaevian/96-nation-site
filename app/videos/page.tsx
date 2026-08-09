import type { Metadata } from "next";

import { EmptyState } from "@/components/EmptyState";
import { Container } from "@/components/ui/Container";
import { getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Videos",
    description:
      "Promo and show videos from 96 Nation (YouTube and Vimeo embeds).",
    path: "/videos",
    settings,
  });
}

export default function VideosPage() {
  // Full CMS video list ships with media PR wiring; empty state is intentional.
  const videos: unknown[] = [];

  return (
    <Container className="py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Videos</h1>
        <p className="mt-4 max-w-prose text-muted">
          Promo and show clips (YouTube and Vimeo).
        </p>
      </header>

      {videos.length === 0 ? (
        <EmptyState
          title="No videos yet"
          description="Clips will land here as we post them. Check events for live show dates in the meantime."
          actionHref="/events"
          actionLabel="Browse events"
        />
      ) : null}
    </Container>
  );
}
