import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  allSanityTags,
  tagsForSanityType,
} from "@/lib/sanity/tags";
import {
  authorizeBearer,
  timingSafeEqualString,
} from "@/lib/security/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/revalidate
 * Sanity publish webhook → on-demand Next.js cache revalidation.
 *
 * Auth (any one; no query-string secrets — leak via logs/proxies/referrers):
 *   Authorization: Bearer ${SANITY_REVALIDATE_SECRET}
 *   x-sanity-revalidate-secret: ${SANITY_REVALIDATE_SECRET}
 *
 * Body (JSON, all optional — empty body revalidates common tags):
 *   {
 *     "_type" | "type": "event" | "page" | "siteSettings" | …,
 *     "slug": "my-event" | { "current": "my-event" },
 *     "tags": ["events", "page:privacy"],
 *     "paths": ["/events", "/"],
 *     "all": true   // revalidate every known Sanity tag
 *   }
 *
 * Also accepts Sanity webhook projection shapes with nested slug.current.
 */

const bodySchema = z
  .object({
    _type: z.string().optional(),
    type: z.string().optional(),
    slug: z
      .union([
        z.string(),
        z.object({ current: z.string().optional().nullable() }).passthrough(),
      ])
      .optional()
      .nullable(),
    tags: z.array(z.string().min(1)).optional(),
    paths: z.array(z.string().min(1)).optional(),
    all: z.boolean().optional(),
  })
  .passthrough();

function authorize(request: Request): boolean {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim();
  if (!secret) {
    console.error("[revalidate] SANITY_REVALIDATE_SECRET not configured");
    return false;
  }

  if (authorizeBearer(request.headers.get("authorization"), secret)) {
    return true;
  }

  // Optional custom header (timing-safe); same pattern as inventory sync.
  // Query-string secrets are intentionally not accepted (URL log leakage).
  const header = request.headers.get("x-sanity-revalidate-secret");
  if (header && timingSafeEqualString(header, secret)) {
    return true;
  }

  return false;
}

function extractSlug(
  slug: z.infer<typeof bodySchema>["slug"],
): string | undefined {
  if (!slug) return undefined;
  if (typeof slug === "string") {
    const s = slug.trim();
    return s || undefined;
  }
  const current = slug.current?.trim();
  return current || undefined;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const text = await request.text();
      if (text.trim()) {
        json = JSON.parse(text);
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const docType = input._type || input.type || null;
  const slug = extractSlug(input.slug);

  const tags = new Set<string>();

  if (input.all) {
    for (const t of allSanityTags()) tags.add(t);
  }

  if (input.tags?.length) {
    for (const t of input.tags) tags.add(t);
  } else if (!input.all) {
    for (const t of tagsForSanityType(docType, slug)) tags.add(t);
  }

  // Always ensure at least the events tag when body is empty (common webhook test).
  if (tags.size === 0) {
    for (const t of tagsForSanityType(null)) tags.add(t);
  }

  const revalidatedTags: string[] = [];
  for (const tag of tags) {
    try {
      revalidateTag(tag);
      revalidatedTags.push(tag);
    } catch (err) {
      console.error("[revalidate] revalidateTag failed:", tag, err);
    }
  }

  const revalidatedPaths: string[] = [];
  const paths = [...(input.paths ?? [])];
  // Helpful defaults when an event slug is known.
  if (slug && (docType === "event" || !docType)) {
    paths.push(`/events/${slug}`);
  }
  if (slug && docType === "page") {
    paths.push(`/${slug}`);
  }

  for (const path of paths) {
    if (!path.startsWith("/")) continue;
    try {
      revalidatePath(path);
      revalidatedPaths.push(path);
    } catch (err) {
      console.error("[revalidate] revalidatePath failed:", path, err);
    }
  }

  // List page + home when events change so featured strip updates.
  if (revalidatedTags.includes("events")) {
    for (const path of ["/events", "/"]) {
      if (revalidatedPaths.includes(path)) continue;
      try {
        revalidatePath(path);
        revalidatedPaths.push(path);
      } catch {
        // non-fatal
      }
    }
  }

  return NextResponse.json({
    ok: true,
    revalidated: true,
    type: docType,
    slug: slug ?? null,
    tags: revalidatedTags,
    paths: revalidatedPaths,
    now: Date.now(),
  });
}

/** Simple health probe (no auth) — confirms route is mounted. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/revalidate",
    method: "POST",
    auth: "Bearer SANITY_REVALIDATE_SECRET",
  });
}
