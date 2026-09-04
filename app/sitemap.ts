import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

const PUBLIC_PATHS = [
  "/",
  "/events",
  "/about",
  "/contact",
  "/genesis",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/events" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/events" ? 0.9 : 0.6,
  }));
}
