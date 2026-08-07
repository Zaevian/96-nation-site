"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import {
  apiVersion,
  dataset,
  getSanityProjectId,
} from "@/lib/sanity/env";
import { schemaTypes } from "@/sanity/schemaTypes";
import { structure } from "@/sanity/structure";

const projectId = getSanityProjectId();

/**
 * Embedded Sanity Studio config (basePath must match /studio route).
 * projectId falls back to a placeholder when env is unset so builds succeed.
 */
export default defineConfig({
  name: "96-nation",
  title: "96 Nation",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    // Prevent creating extra siteSettings docs (singleton via structure)
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === "global") {
        return prev.filter((template) => template.templateId !== "siteSettings");
      }
      return prev;
    },
    // Singleton: no delete / duplicate for siteSettings
    actions: (prev, { schemaType }) => {
      if (schemaType === "siteSettings") {
        return prev.filter(
          (action) =>
            action.action !== "delete" &&
            action.action !== "duplicate",
        );
      }
      return prev;
    },
  },
});
