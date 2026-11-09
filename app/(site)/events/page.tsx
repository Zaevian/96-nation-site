import type { Metadata } from "next";

import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { FollowCallout } from "@/components/FollowCallout";
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
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Live
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-fg sm:text-4xl">
          Events
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-muted sm:text-lg">
          Upcoming all-ages shows in Tallahassee. Tap a night for details and
          tickets.
        </p>
      </header>

      {events.length === 0 ? (
        <EmptyState
          title="No published events yet"
          description="New shows land here when we announce them. Check back soon, or get in touch if you're looking for a date."
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
              <ul
                className={
                  upcoming.length === 1
                    ? "mx-auto grid max-w-md gap-4 sm:max-w-lg"
                    : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                }
              >
                {upcoming.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </ul>
            ) : (
              <FollowCallout
                title="No dates on the board right now"
                description="The next show gets announced on Instagram first, then lands here with tickets. Follow so you catch the drop."
                secondaryHref="/contact"
                secondaryLabel="Book or collab"
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
                className="font-display text-2xl font-bold uppercase tracking-tight text-fg"
              >
                Past nights
              </h2>
              <ul
                className={
                  past.length === 1
                    ? "mx-auto mt-4 grid max-w-md gap-4 sm:max-w-lg"
                    : "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                }
              >
                {past.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    headingLevel={3}
                    past
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
              <ul
                className={
                  cancelled.length === 1
                    ? "mx-auto mt-4 grid max-w-md gap-4 sm:max-w-lg"
                    : "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                }
              >
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
