import { defineField, defineType } from "sanity";

/**
 * Ticket type on an event.
 * `id` is stable and mirrored into Postgres inventory (PR 7+).
 * priceCents === 0 means free / RSVP.
 */
export const ticketType = defineType({
  name: "ticketType",
  title: "Ticket type",
  type: "object",
  fields: [
    defineField({
      name: "id",
      title: "Ticket type ID",
      type: "string",
      description:
        "Stable machine id (e.g. general, early-bird). Do not change after sales start.",
      validation: (Rule) =>
        Rule.required()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
            name: "kebab-case",
            invert: false,
          })
          .error("Required: lowercase letters, numbers, hyphens only"),
    }),
    defineField({
      name: "name",
      title: "Display name",
      type: "string",
      validation: (Rule) => Rule.required().error("Display name is required"),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "priceCents",
      title: "Price (cents)",
      type: "number",
      description: "USD cents. Use 0 for free / RSVP tickets.",
      initialValue: 700,
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(0)
          .error("Price in cents is required (0 = free)"),
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      initialValue: "usd",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "capacity",
      title: "Capacity",
      type: "number",
      description:
        "Initial capacity mirrored to Postgres. After tickets sell, capacity can only increase or stay ≥ sold+reserved.",
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(1)
          .error("Capacity is required (at least 1)"),
    }),
    defineField({
      name: "maxPerOrder",
      title: "Max per order",
      type: "number",
      initialValue: 8,
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(1)
          .max(50)
          .error("Max per order is required")
          .custom((maxPerOrder, context) => {
            if (maxPerOrder == null) return true;
            const capacity = (
              context.parent as { capacity?: number } | undefined
            )?.capacity;
            if (
              typeof capacity === "number" &&
              typeof maxPerOrder === "number" &&
              maxPerOrder > capacity
            ) {
              return "Max per order cannot exceed capacity";
            }
            return true;
          }),
    }),
    defineField({
      name: "salesStart",
      title: "Sales start",
      type: "datetime",
    }),
    defineField({
      name: "salesEnd",
      title: "Sales end",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "name",
      id: "id",
      priceCents: "priceCents",
      capacity: "capacity",
    },
    prepare({ title, id, priceCents, capacity }) {
      const dollars =
        typeof priceCents === "number"
          ? (priceCents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })
          : "?";
      return {
        title: title || "Untitled ticket",
        subtitle: `${id || "no-id"} · ${dollars} · cap ${capacity ?? "?"}`,
      };
    },
  },
});
