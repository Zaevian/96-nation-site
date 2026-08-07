import type { EventListItem, EventTicketType } from "@/lib/sanity/types";

const DEFAULT_TZ = "America/New_York";

/** Format event start for cards (short). */
export function formatEventDate(
  iso?: string | null,
  timeZone: string = DEFAULT_TZ,
): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

/** Format event start for detail pages (long). */
export function formatEventDateLong(
  iso?: string | null,
  timeZone: string = DEFAULT_TZ,
): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

/** USD from integer cents. */
export function formatPriceCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/**
 * Sold-out from Sanity capacity only (until Supabase inventory).
 * True when there are ticket types and every type has capacity <= 0.
 * Cancelled is separate and should win in the UI.
 */
export function isSoldOutFromCapacity(
  ticketTypes?:
    | Pick<EventTicketType, "capacity">[]
    | null
    | EventListItem["ticketTypes"],
): boolean {
  if (!ticketTypes || ticketTypes.length === 0) return false;
  return ticketTypes.every(
    (t) => typeof t.capacity === "number" && t.capacity <= 0,
  );
}

/** Whether a ticket type is currently on sale (by sales window). */
export function isTicketOnSale(
  ticket: Pick<EventTicketType, "salesStart" | "salesEnd">,
  now: Date = new Date(),
): boolean {
  const t = now.getTime();
  if (ticket.salesStart) {
    const start = new Date(ticket.salesStart).getTime();
    if (!Number.isNaN(start) && t < start) return false;
  }
  if (ticket.salesEnd) {
    const end = new Date(ticket.salesEnd).getTime();
    if (!Number.isNaN(end) && t > end) return false;
  }
  return true;
}

/** Lowest price among ticket types, or null if none. */
export function lowestPriceCents(
  ticketTypes?: Pick<EventTicketType, "priceCents">[] | null,
): number | null {
  if (!ticketTypes || ticketTypes.length === 0) return null;
  let min: number | null = null;
  for (const t of ticketTypes) {
    if (typeof t.priceCents !== "number") continue;
    if (min === null || t.priceCents < min) min = t.priceCents;
  }
  return min;
}

/**
 * Checkout stub URL until full checkout PR.
 * Aligns with DESIGN: `/checkout/{slug}?type={ticketTypeId}`.
 */
export function checkoutHref(eventSlug: string, ticketTypeId: string): string {
  const slug = encodeURIComponent(eventSlug);
  const params = new URLSearchParams({ type: ticketTypeId });
  return `/checkout/${slug}?${params.toString()}`;
}

/**
 * True while the event has not fully ended.
 * Uses endAt when set, otherwise startAt (so past one-shot events drop out of “upcoming”).
 */
export function isEventUpcoming(
  event: Pick<EventListItem, "startAt" | "endAt">,
  now: Date = new Date(),
): boolean {
  const endIso = event.endAt || event.startAt;
  if (!endIso) return true;
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end)) return true;
  return end >= now.getTime();
}
