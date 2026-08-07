import type { Metadata } from "next";

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
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Galleries</h1>
      <p className="mt-4 max-w-prose text-muted">
        Photo galleries will be loaded from the CMS in a later PR. Stub for
        primary navigation.
      </p>
    </Container>
  );
}
