import {
  CalendarIcon,
  CogIcon,
  ComposeIcon,
  DocumentIcon,
  HelpCircleIcon,
  ImagesIcon,
  PlayIcon,
} from "@sanity/icons";
import type { StructureResolver } from "sanity/structure";

import { HowToPublish } from "./components/HowToPublish";

/**
 * Desk structure: help tip + singleton site settings + content lists.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("How to publish")
        .icon(HelpCircleIcon)
        .child(
          S.component(HowToPublish)
            .title("How to publish")
            .id("how-to-publish"),
        ),
      S.divider(),
      S.listItem()
        .title("Site settings")
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Site settings"),
        ),
      S.divider(),
      S.listItem()
        .title("Events")
        .icon(CalendarIcon)
        .child(
          S.documentTypeList("event")
            .title("Events")
            .defaultOrdering([{ field: "startAt", direction: "desc" }]),
        ),
      S.listItem()
        .title("Pages")
        .icon(DocumentIcon)
        .child(S.documentTypeList("page").title("Pages")),
      S.listItem()
        .title("Galleries")
        .icon(ImagesIcon)
        .child(S.documentTypeList("gallery").title("Galleries")),
      S.listItem()
        .title("Videos")
        .icon(PlayIcon)
        .child(S.documentTypeList("video").title("Videos")),
      S.listItem()
        .title("Form configs")
        .icon(ComposeIcon)
        .child(S.documentTypeList("formConfig").title("Form configs")),
    ]);
