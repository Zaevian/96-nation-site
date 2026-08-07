"use client";

import { Card, Heading, Stack, Text } from "@sanity/ui";

/** Desk tip for non-technical editors: how to publish content safely. */
export function HowToPublish() {
  return (
    <Card padding={4} sizing="border" style={{ maxWidth: 640 }}>
      <Stack space={4}>
        <Heading as="h2" size={2}>
          How to publish
        </Heading>
        <Text size={1} muted>
          Two tools only: <strong>/studio</strong> (this app) for content, and{" "}
          <strong>/admin</strong> for orders and form inbox.
        </Text>

        <Heading as="h3" size={1}>
          Events (checklist)
        </Heading>
        <Text as="div" size={1}>
          <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>Create an Event and leave Status on <strong>Draft</strong>.</li>
            <li>
              Fill required fields until validation is clean: title, slug, start
              time, hero image (+ alt), and at least one ticket type (id, name,
              price in cents, capacity, max per order).
            </li>
            <li>
              Optional: short code for social deep links (
              <code>/t/your-code</code>), venue, OG image.
            </li>
            <li>
              Set Status to <strong>Published</strong>, then use Sanity&apos;s
              Publish button so the site can show the event.
            </li>
            <li>
              After on-sale inventory sync (later PR), capacity is guarded by
              Postgres — only increase capacity if tickets already sold.
            </li>
          </ol>
        </Text>

        <Heading as="h3" size={1}>
          Videos
        </Heading>
        <Text size={1}>
          Paste a YouTube or Vimeo URL into <strong>Video URL</strong>. Do not
          upload large video files to Sanity.
        </Text>

        <Heading as="h3" size={1}>
          Pages & site settings
        </Heading>
        <Text size={1}>
          Edit <strong>Site settings</strong> for home hero, about, social
          links, and the default share image. Use <strong>Pages</strong> for
          Privacy, Terms, Genesis copy, etc.
        </Text>

        <Text size={1} muted>
          Drafts can be saved with validation errors. Fix red errors before
          publishing so the public site never gets incomplete events.
        </Text>
      </Stack>
    </Card>
  );
}
