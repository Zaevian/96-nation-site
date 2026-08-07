import { NextResponse } from "next/server";

import { getEventByShortCode } from "@/lib/sanity/queries";

type RouteContext = {
  params: Promise<{ code: string }>;
};

/**
 * Short deep link: GET /t/[code] → 302 /events/{slug}
 * Resolves Sanity event.shortCode for published/cancelled events only.
 * Drafts and unknown codes → 404. No Supabase short_links table.
 */
export async function GET(request: Request, context: RouteContext) {
  const { code: raw } = await context.params;
  let code = "";
  try {
    code = decodeURIComponent(raw || "").trim();
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!code || !/^[A-Za-z0-9_-]{2,32}$/.test(code)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const event = await getEventByShortCode(code);
  if (!event?.slug) {
    return new NextResponse("Not found", { status: 404 });
  }

  const destination = new URL(`/events/${event.slug}`, request.url);
  return NextResponse.redirect(destination, 302);
}
