import { event } from "./event";
import { formConfig } from "./formConfig";
import { gallery } from "./gallery";
import { navItem } from "./objects/navItem";
import { portableText } from "./objects/portableText";
import { seo } from "./objects/seo";
import { socialLink } from "./objects/socialLink";
import { ticketType } from "./objects/ticketType";
import { venue } from "./objects/venue";
import { page } from "./page";
import { siteSettings } from "./siteSettings";
import { video } from "./video";

export const schemaTypes = [
  // Documents
  siteSettings,
  page,
  event,
  gallery,
  video,
  formConfig,
  // Objects
  portableText,
  seo,
  venue,
  ticketType,
  socialLink,
  navItem,
];
