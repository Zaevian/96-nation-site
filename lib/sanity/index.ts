export {
  apiVersion,
  dataset,
  getSanityProjectId,
  isSanityConfigured,
  PLACEHOLDER_PROJECT_ID,
  projectId,
  readToken,
} from "./env";
export { getClient, getServerClient, sanityFetch } from "./client";
export { urlForImage } from "./image";
export {
  getEventBySlug,
  getFeaturedEvents,
  getPageBySlug,
  getSiteSettings,
} from "./queries";
export type {
  CmsPage,
  FeaturedEvent,
  SanityImage,
  SeoFields,
  SiteSettings,
} from "./types";
