import type { Metadata } from "next";

import { EventCard } from "@/components/EventCard";
import { Container } from "@/components/ui/Container";
import { getEvents, getSiteSettings } from "@/lib/sanity/queries";
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

export default async function EventsPage() {
  const events = await getEvents();
  const upcoming = events.filter((e) => e.status !== "cancelled");
  const cancelled = events.filter((e) => e.status === "cancelled");

  return (
    <Container className="py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Events</h1>
        <p className="mt-4 max-w-prose text-muted">
          Upcoming all-ages shows in the Tallahassee area. Tap an event for
          details and tickets.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="mt-10 max-w-prose text-muted" role="status">
          No published events yet. Check back soon — new shows land here once
          they go live in the CMS.
        </p>
      ) : (
        <>
          {upcoming.length > 0 ? (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </ul>
          ) : (
            <p className="mt-10 max-w-prose text-muted" role="status">
              No upcoming events right now. Cancelled listings are below if
              available.
            </p>
          )}

          {cancelled.length > 0 ? (
            <section
              aria-labelledby="cancelled-events-heading"
              className="mt-14"
            >
              <h2
                id="cancelled-events-heading"
                className="text-lg font-semibold tracking-tight text-fg"
              >
                Cancelled
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cancelled.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    headingLevel={3}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </Container>
  );
}
