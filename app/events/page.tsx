import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Events",
    description:
      "Upcoming 96 Nation shows and tickets. Browse all-ages events in the Tallahassee area.",
    path: "/events",
    settings,
  });
}

export default function EventsPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Events</h1>
      <p className="mt-4 max-w-prose text-muted">
        Upcoming shows will appear here once CMS content is connected. Event
        detail pages resolve from home featured cards; full list and checkout
        land in a later PR.
      </p>
    </Container>
  );
}
