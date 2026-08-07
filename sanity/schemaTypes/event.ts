import { CalendarIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Event document with publish-oriented required-field validation.
 * Drafts can be saved with errors; fixing validation is required before a clean publish.
 */
export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  icon: CalendarIcon,
  groups: [
    { name: "basics", title: "Basics", default: true },
    { name: "whenWhere", title: "When & where" },
    { name: "tickets", title: "Tickets" },
    { name: "media", title: "Media" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "basics",
      validation: (Rule) => Rule.required().error("Title is required to publish"),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "basics",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().error("Slug is required to publish (powers /events/[slug])"),
    }),
    defineField({
      name: "shortCode",
      title: "Short code",
      type: "string",
      group: "basics",
      description:
        "Optional unique code for deep links: /t/[code] → this event. Letters/numbers only.",
      validation: (Rule) =>
        Rule.regex(/^[A-Za-z0-9_-]{2,32}$/, {
          name: "short-code",
          invert: false,
        }).warning("Use 2–32 letters, numbers, _ or -"),
    }),
    defineField({
      name: "summary",
      title: "Short summary",
      type: "text",
      rows: 2,
      group: "basics",
      description: "Card blurb on the events list.",
    }),
    defineField({
      name: "body",
      title: "Description",
      type: "portableText",
      group: "basics",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "basics",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Published", value: "published" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
      validation: (Rule) => Rule.required(),
    }),

    // When & where
    defineField({
      name: "startAt",
      title: "Starts at",
      type: "datetime",
      group: "whenWhere",
      options: { dateFormat: "YYYY-MM-DD", timeFormat: "HH:mm" },
      validation: (Rule) =>
        Rule.required().error("Start time is required to publish"),
    }),
    defineField({
      name: "endAt",
      title: "Ends at",
      type: "datetime",
      group: "whenWhere",
      options: { dateFormat: "YYYY-MM-DD", timeFormat: "HH:mm" },
    }),
    defineField({
      name: "timezone",
      title: "Timezone",
      type: "string",
      group: "whenWhere",
      initialValue: "America/New_York",
      description: "IANA timezone (defaults to site timezone).",
    }),
    defineField({
      name: "venue",
      title: "Venue",
      type: "venue",
      group: "whenWhere",
    }),

    // Tickets — required for publish
    defineField({
      name: "ticketTypes",
      title: "Ticket types",
      type: "array",
      group: "tickets",
      of: [defineArrayMember({ type: "ticketType" })],
      description:
        "At least one ticket type is required to publish. priceCents 0 = free RSVP. Capacity seeds Postgres inventory after on-sale sync.",
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error("Add at least one ticket type to publish")
          .custom((types) => {
            if (!types || !Array.isArray(types) || types.length === 0) {
              return true; // min(1) handles empty
            }
            const ids = types
              .map((t) =>
                t && typeof t === "object" && "id" in t
                  ? String((t as { id?: string }).id || "")
                  : "",
              )
              .filter(Boolean);
            const unique = new Set(ids);
            if (ids.length !== unique.size) {
              return "Ticket type IDs must be unique within an event";
            }
            return true;
          }),
    }),
    defineField({
      name: "onSaleSyncedAt",
      title: "Inventory last synced at",
      type: "datetime",
      group: "tickets",
      readOnly: true,
      description: "Set by inventory sync webhook (server). Leave empty in Studio.",
      hidden: ({ value }) => !value,
    }),

    // Media
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          validation: (Rule) =>
            Rule.required().error("Hero image alt text is required"),
        }),
      ],
      validation: (Rule) =>
        Rule.required().error("Hero image is required to publish"),
    }),
    defineField({
      name: "promoVideoUrl",
      title: "Promo video URL",
      type: "url",
      group: "media",
      description: "YouTube or Vimeo URL (preferred over file upload).",
      validation: (Rule) =>
        Rule.uri({ scheme: ["http", "https"] }).custom((url) => {
          if (!url) return true;
          const ok =
            /youtube\.com|youtu\.be|vimeo\.com/i.test(url) ||
            url.includes("youtube") ||
            url.includes("vimeo");
          return ok || "Use a YouTube or Vimeo URL";
        }),
    }),
    defineField({
      name: "promoVideoFile",
      title: "Promo video file (discouraged)",
      type: "file",
      group: "media",
      description:
        "Avoid uploading large videos to Sanity. Prefer promoVideoUrl (YouTube/Vimeo).",
      options: {
        accept: "video/*",
      },
      hidden: true,
    }),
    defineField({
      name: "galleries",
      title: "Related galleries",
      type: "array",
      group: "media",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "gallery" }],
        }),
      ],
    }),

    // SEO
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
      description:
        "For publish: set an OG image here, or rely on Site Settings → default OG image.",
      validation: (Rule) =>
        Rule.custom((seo, context) => {
          const doc = context.document as {
            status?: string;
            heroImage?: unknown;
          } | null;
          // Soft rule: when marking published, want OG or hero as share image
          if (doc?.status === "published") {
            const og = seo && typeof seo === "object" && "ogImage" in seo
              ? (seo as { ogImage?: unknown }).ogImage
              : undefined;
            if (!og && !doc.heroImage) {
              return "Published events need an OG image or hero image for share cards";
            }
          }
          return true;
        }),
    }),
  ],
  orderings: [
    {
      title: "Start date, upcoming",
      name: "startAtAsc",
      by: [{ field: "startAt", direction: "asc" }],
    },
    {
      title: "Start date, newest",
      name: "startAtDesc",
      by: [{ field: "startAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      status: "status",
      startAt: "startAt",
      media: "heroImage",
    },
    prepare({ title, status, startAt, media }) {
      const when = startAt
        ? new Date(startAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "No start time";
      return {
        title: title || "Untitled event",
        subtitle: `${status || "draft"} · ${when}`,
        media,
      };
    },
  },
});
