import type { Metadata } from "next";

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
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Videos</h1>
      <p className="mt-4 max-w-prose text-muted">
        Promo and show videos (YouTube/Vimeo embeds) will appear here. Stub for
        primary navigation.
      </p>
    </Container>
  );
}
