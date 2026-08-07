import { ComposeIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

/**
 * Optional CMS copy for Genesis / contact form pages.
 * Reuse `page` for long-form Genesis content; this holds form chrome + success messages.
 */
export const formConfig = defineType({
  name: "formConfig",
  title: "Form config",
  type: "document",
  icon: ComposeIcon,
  fields: [
    defineField({
      name: "formType",
      title: "Form type",
      type: "string",
      options: {
        list: [
          { title: "Genesis signup", value: "genesis-signup" },
          { title: "Service inquiry", value: "service-inquiry" },
          { title: "Contact", value: "contact" },
        ],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Form title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Intro copy",
      type: "portableText",
    }),
    defineField({
      name: "successTitle",
      title: "Success title",
      type: "string",
      initialValue: "Thanks — we got it.",
    }),
    defineField({
      name: "successMessage",
      title: "Success message",
      type: "text",
      rows: 3,
      initialValue: "We will be in touch soon.",
    }),
    defineField({
      name: "submitLabel",
      title: "Submit button label",
      type: "string",
      initialValue: "Send",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "formType" },
  },
});
