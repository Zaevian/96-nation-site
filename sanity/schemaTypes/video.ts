import { PlayIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

function detectProvider(
  url: string | undefined,
): "youtube" | "vimeo" | "unknown" {
  if (!url) return "unknown";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  return "unknown";
}

/**
 * Video = external YouTube/Vimeo URL by default (no large CMS uploads).
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
            const provider = detectProvider(url);
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
      description: "Usually auto-detected from the URL; adjust if needed.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { externalUrl?: string } | undefined;
          const detected = detectProvider(parent?.externalUrl);
          if (detected !== "unknown" && value && value !== detected) {
            return `URL looks like ${detected}; provider is set to ${value}`;
          }
          return true;
        }).warning(),
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
      const detected = detectProvider(url);
      return {
        title: title || "Untitled video",
        subtitle: `${provider || detected} · ${url || "no url"}`,
        media,
      };
    },
  },
});
