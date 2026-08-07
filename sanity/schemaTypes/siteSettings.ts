import { CogIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "brand", title: "Brand", default: true },
    { name: "home", title: "Home" },
    { name: "about", title: "About" },
    { name: "nav", title: "Navigation" },
    { name: "seo", title: "SEO defaults" },
  ],
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site title",
      type: "string",
      group: "brand",
      initialValue: "96 Nation",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      group: "brand",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "brand",
      options: { hotspot: true },
    }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      group: "brand",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "timezone",
      title: "Default timezone",
      type: "string",
      group: "brand",
      initialValue: "America/New_York",
      description: "IANA timezone for event display (e.g. America/New_York).",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "footerBlurb",
      title: "Footer blurb",
      type: "text",
      rows: 3,
      group: "brand",
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      group: "brand",
      of: [{ type: "socialLink" }],
    }),

    // Home hero
    defineField({
      name: "homeHeroTitle",
      title: "Home hero title",
      type: "string",
      group: "home",
    }),
    defineField({
      name: "homeHeroSubtitle",
      title: "Home hero subtitle",
      type: "text",
      rows: 3,
      group: "home",
    }),
    defineField({
      name: "homeHeroImage",
      title: "Home hero image",
      type: "image",
      group: "home",
      options: { hotspot: true },
    }),
    defineField({
      name: "homeHeroCtaLabel",
      title: "Home CTA label",
      type: "string",
      group: "home",
      initialValue: "See events",
    }),
    defineField({
      name: "homeHeroCtaHref",
      title: "Home CTA link",
      type: "string",
      group: "home",
      initialValue: "/events",
      description: "Internal path (e.g. /events) or http(s) URL.",
      validation: (Rule) =>
        Rule.required().custom((value) => {
          if (!value || typeof value !== "string") return "Required";
          const href = value.trim();
          if (/^https?:\/\//i.test(href)) return true;
          if (href.startsWith("/") && !href.startsWith("//")) return true;
          return "Use a path starting with / or an http(s) URL";
        }),
    }),

    // About
    defineField({
      name: "aboutTitle",
      title: "About title",
      type: "string",
      group: "about",
      initialValue: "About 96 Nation",
    }),
    defineField({
      name: "aboutBody",
      title: "About body",
      type: "portableText",
      group: "about",
    }),

    // Nav
    defineField({
      name: "primaryNav",
      title: "Primary navigation",
      type: "array",
      group: "nav",
      of: [{ type: "navItem" }],
      description: "Mobile primary nav items (Home · Events · Genesis · …).",
    }),

    // SEO defaults
    defineField({
      name: "defaultOgImage",
      title: "Default Open Graph image",
      type: "image",
      group: "seo",
      options: { hotspot: true },
      description: "Used when a page/event has no OG image of its own.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site settings" };
    },
  },
});
