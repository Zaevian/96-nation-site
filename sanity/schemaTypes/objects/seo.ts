import { defineField, defineType } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      description: "Overrides the document title in search results and social cards.",
      validation: (Rule) => Rule.max(70).warning("Keep under ~70 characters"),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(160).warning("Keep under ~160 characters"),
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph image",
      type: "image",
      options: { hotspot: true },
      description:
        "Share card image. If empty, the site default OG image from Site Settings is used.",
    }),
  ],
});
