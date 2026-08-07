import { ImagesIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const gallery = defineType({
  name: "gallery",
  title: "Gallery",
  type: "document",
  icon: ImagesIcon,
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
      name: "images",
      title: "Images",
      type: "array",
      description: "Prefer long-edge ≤ 2500px for editor uploads.",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              type: "string",
              title: "Alt text",
              validation: (Rule) =>
                Rule.required().error("Alt text is required for every image"),
            }),
            defineField({
              name: "caption",
              type: "string",
              title: "Caption",
            }),
          ],
        }),
      ],
      validation: (Rule) => Rule.min(1).warning("Add at least one image"),
    }),
    defineField({
      name: "eventRef",
      title: "Related event",
      type: "reference",
      to: [{ type: "event" }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "images.0",
      subtitle: "slug.current",
    },
  },
});
