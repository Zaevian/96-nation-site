import { CalendarIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

import { isYouTubeOrVimeoUrl } from "../lib/videoProvider";
import { apiVersion } from "@/lib/sanity/env";

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
        "Optional unique code for deep links: /t/[code] → this event. Must be unique across events.",
      validation: (Rule) =>
        Rule.custom(async (shortCode, context) => {
          if (!shortCode) return true;
          if (!/^[A-Za-z0-9_-]{2,32}$/.test(shortCode)) {
            return "Use 2–32 letters, numbers, _ or -";
          }
          try {
            const client = context.getClient({ apiVersion });
            const rawId = context.document?._id || "";
            const publishedId = rawId.replace(/^drafts\./, "");
            const draftId = publishedId ? `drafts.${publishedId}` : "";
            const count = await client.fetch<number>(
              `count(*[_type == "event" && shortCode == $code && !(_id in $ids)])`,
              {
                code: shortCode,
                ids: [publishedId, draftId].filter(Boolean),
              },
            );
            return count === 0
              ? true
              : "Short code already used by another event";
          } catch {
            // Skip uniqueness when API is unreachable (e.g. placeholder project)
            return true;
          }
        }),
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
      validation: (Rule) =>
        Rule.custom((endAt, context) => {
          if (!endAt) return true;
          const startAt = (context.parent as { startAt?: string } | undefined)
            ?.startAt;
          if (!startAt) return true;
          if (new Date(endAt).getTime() < new Date(startAt).getTime()) {
            return "End time must be on or after start time";
          }
          return true;
        }),
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
          return (
            isYouTubeOrVimeoUrl(url) || "Use a YouTube or Vimeo URL"
          );
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

    // SEO — hero is required and used as share image when ogImage is unset;
    // frontend may also fall back to Site Settings default OG for other pages.
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
      description:
        "Optional OG override. Share cards use seo.ogImage if set, otherwise the event hero image (required). Site Settings default OG is a site-wide fallback for pages without their own image.",
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
