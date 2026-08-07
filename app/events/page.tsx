import type { Metadata } from "next";

import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { Container } from "@/components/ui/Container";
import { isEventUpcoming } from "@/lib/events";
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
  const now = new Date();
  const active = events.filter((e) => e.status !== "cancelled");
  const upcoming = active
    .filter((e) => isEventUpcoming(e, now))
    .sort((a, b) => {
      const ta = a.startAt ? new Date(a.startAt).getTime() : 0;
      const tb = b.startAt ? new Date(b.startAt).getTime() : 0;
      return ta - tb;
    });
  const past = active
    .filter((e) => !isEventUpcoming(e, now))
    .sort((a, b) => {
      const ta = a.startAt ? new Date(a.startAt).getTime() : 0;
      const tb = b.startAt ? new Date(b.startAt).getTime() : 0;
      return tb - ta;
    });
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
        <EmptyState
          title="No published events yet"
          description="New shows land here once they go live in the CMS. Check back soon, or get in touch if you’re looking for a date."
          actionHref="/contact"
          actionLabel="Contact us"
        />
      ) : (
        <>
          <section aria-labelledby="upcoming-events-heading" className="mt-10">
            <h2
              id="upcoming-events-heading"
              className="sr-only"
            >
              Upcoming
            </h2>
            {upcoming.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </ul>
            ) : (
              <EmptyState
                className="mt-0"
                title="No upcoming events right now"
                description={
                  past.length > 0 || cancelled.length > 0
                    ? "Past and cancelled listings are below if available. Follow us or check back for the next show."
                    : "Check back soon — new dates will appear here when published."
                }
                actionHref="/"
                actionLabel="Back home"
              />
            )}
          </section>

          {past.length > 0 ? (
            <section
              aria-labelledby="past-events-heading"
              className="mt-14"
            >
              <h2
                id="past-events-heading"
                className="text-lg font-semibold tracking-tight text-fg"
              >
                Past
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    headingLevel={3}
                  />
                ))}
              </ul>
            </section>
          ) : null}

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
