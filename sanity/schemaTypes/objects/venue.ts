import { defineField, defineType } from "sanity";

export const venue = defineType({
  name: "venue",
  title: "Venue",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Venue name",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Street address",
      type: "string",
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      initialValue: "Tallahassee",
    }),
    defineField({
      name: "mapUrl",
      title: "Map URL",
      type: "url",
      description: "Google Maps or Apple Maps link for directions.",
      validation: (Rule) =>
        Rule.uri({ scheme: ["http", "https"] }).warning(
          "Use a full https:// maps link",
        ),
    }),
  ],
});
