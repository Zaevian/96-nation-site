import { PlayIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

import { detectVideoProvider } from "../lib/videoProvider";

/**
 * Video = external YouTube/Vimeo URL by default (no large CMS uploads).
 * Prefer deriving provider from URL at read time; stored provider must match host.
 */
export const video = defineType({
  name: "video",
  title: "Video",
  type: "document",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "externalUrl",
      title: "Video URL",
      type: "url",
      description:
        "YouTube or Vimeo link. This is the v1 default — do not upload video files to Sanity.",
      validation: (Rule) =>
        Rule.required()
          .uri({ scheme: ["http", "https"] })
          .custom((url) => {
            if (!url) return "Video URL is required";
            const provider = detectVideoProvider(url);
            if (provider === "unknown") {
              return "Use a YouTube or Vimeo URL";
            }
            return true;
          }),
    }),
    defineField({
      name: "provider",
      title: "Provider",
      type: "string",
      options: {
        list: [
          { title: "YouTube", value: "youtube" },
          { title: "Vimeo", value: "vimeo" },
        ],
        layout: "radio",
      },
      initialValue: "youtube",
      description:
        "Must match the Video URL host. Frontend should prefer detecting provider from externalUrl if unsure.",
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const parent = context.parent as { externalUrl?: string } | undefined;
          const detected = detectVideoProvider(parent?.externalUrl);
          if (detected === "unknown") {
            // URL field will flag invalid hosts; avoid double-error noise
            return true;
          }
          if (value !== detected) {
            return `Provider must be “${detected}” for this URL (got “${value}”)`;
          }
          return true;
        }),
    }),
    defineField({
      name: "poster",
      title: "Poster image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
        }),
      ],
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      provider: "provider",
      url: "externalUrl",
      media: "poster",
    },
    prepare({ title, provider, url, media }) {
      const detected = detectVideoProvider(url);
      return {
        title: title || "Untitled video",
        subtitle: `${detected !== "unknown" ? detected : provider || "?"} · ${url || "no url"}`,
        media,
      };
    },
  },
});
