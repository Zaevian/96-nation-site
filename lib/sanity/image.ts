import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";

import { dataset, getSanityProjectId, isSanityConfigured } from "./env";

const builder = isSanityConfigured()
  ? createImageUrlBuilder({
      projectId: getSanityProjectId(),
      dataset,
    })
  : null;

/** Build a Sanity CDN image URL, or null if unconfigured / missing source. */
export function urlForImage(source: SanityImageSource | null | undefined) {
  if (!builder || !source) {
    return null;
  }
  return builder.image(source);
}
