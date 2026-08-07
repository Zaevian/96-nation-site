import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Events",
};

export default function EventsPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Events</h1>
      <p className="mt-4 max-w-prose text-muted">
        Upcoming shows will appear here once CMS content is connected. This is
        a navigation stub for the design system and accessibility shell.
      </p>
    </Container>
  );
}
