import "server-only";

import { isTicketOnSale } from "@/lib/events";
import { getEventBySlug } from "@/lib/sanity/queries";
import type { EventDetail, EventTicketType } from "@/lib/sanity/types";

export type CheckoutEventContext = {
  event: EventDetail;
  ticket: EventTicketType;
};

export type ResolveEventError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "CANCELLED"; message: string }
  | { code: "TICKET_NOT_FOUND"; message: string }
  | { code: "NOT_ON_SALE"; message: string };

/**
 * Load published event + ticket type for checkout APIs.
 */
export async function resolveCheckoutEvent(
  eventSlug: string,
  ticketTypeId: string,
): Promise<
  | { ok: true; data: CheckoutEventContext }
  | { ok: false; error: ResolveEventError }
> {
  const event = await getEventBySlug(eventSlug);
  if (!event) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Event not found" },
    };
  }

  if (event.status === "cancelled") {
    return {
      ok: false,
      error: {
        code: "CANCELLED",
        message: "This event has been cancelled",
      },
    };
  }

  const ticket = event.ticketTypes?.find((t) => t.id === ticketTypeId);
  if (!ticket) {
    return {
      ok: false,
      error: {
        code: "TICKET_NOT_FOUND",
        message: "Ticket type not found for this event",
      },
    };
  }

  if (!isTicketOnSale(ticket)) {
    return {
      ok: false,
      error: {
        code: "NOT_ON_SALE",
        message: "This ticket type is not currently on sale",
      },
    };
  }

  return { ok: true, data: { event, ticket } };
}

export function maxQuantityForTicket(ticket: EventTicketType): number {
  const max = ticket.maxPerOrder ?? 10;
  return Math.max(1, Math.min(50, max));
}
