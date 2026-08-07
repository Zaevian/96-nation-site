import { NextResponse } from "next/server";
import {
  canCreateServiceClient,
  createServiceClient,
} from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notifyAdminFormSubmission } from "@/lib/email/notify";
import {
  isFormType,
  payloadForStorage,
  schemaForType,
  type FormType,
} from "@/lib/validations/forms";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8192;

type RouteContext = {
  params: Promise<{ type: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { type: rawType } = await context.params;

  if (!isFormType(rawType)) {
    return NextResponse.json(
      { error: "Unknown form type", code: "VALIDATION" },
      { status: 400 },
    );
  }

  const formType: FormType = rawType;

  // Rate limit before body parse (cheap reject under flood)
  const ip = clientIp(request);
  const limited = await rateLimit(`forms:${formType}:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((limited.reset - Date.now()) / 1000)),
          ),
          "X-RateLimit-Limit": String(limited.limit),
          "X-RateLimit-Remaining": String(limited.remaining),
        },
      },
    );
  }

  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Invalid body", code: "VALIDATION" },
      { status: 400 },
    );
  }

  if (rawText.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Payload too large", code: "VALIDATION" },
      { status: 413 },
    );
  }

  let json: unknown;
  try {
    json = rawText ? JSON.parse(rawText) : {};
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "VALIDATION" },
      { status: 400 },
    );
  }

  const schema = schemaForType(formType);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  // Honeypot: silent success, no store / no email
  const website = parsed.data.website;
  if (typeof website === "string" && website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const payload = payloadForStorage(
    formType,
    parsed.data as unknown as Record<string, unknown>,
  );

  // Size guard after allowlist (DB CHECK is 8KB)
  if (JSON.stringify(payload).length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Payload too large", code: "VALIDATION" },
      { status: 413 },
    );
  }

  if (!canCreateServiceClient()) {
    console.warn(
      "[forms] Supabase service role not configured; accepting without persist",
    );
    // Graceful for local/demo without Supabase: pretend success so UI works
    return NextResponse.json({
      ok: true,
      id: null,
      persisted: false,
    });
  }

  let submissionId: string;
  try {
    const supabase = createServiceClient();
    const sourcePath = request.headers.get("x-source-path") ?? null;
    const userAgent = request.headers.get("user-agent") ?? null;

    const { data, error } = await supabase
      .from("form_submissions")
      .insert({
        form_type: formType,
        payload,
        source_path: sourcePath,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[forms] insert failed", error);
      return NextResponse.json(
        { error: "Could not save submission", code: "SERVER" },
        { status: 502 },
      );
    }

    submissionId = data.id as string;
  } catch (err) {
    console.error("[forms] service client error", err);
    return NextResponse.json(
      { error: "Storage unavailable", code: "SERVER" },
      { status: 503 },
    );
  }

  // Notify admin (non-blocking for response correctness; still await briefly)
  const notify = await notifyAdminFormSubmission({
    formType,
    payload,
    submissionId,
  });

  if (notify.sent && canCreateServiceClient()) {
    try {
      const supabase = createServiceClient();
      await supabase
        .from("form_submissions")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", submissionId);
    } catch (err) {
      console.error("[forms] notified_at update failed", err);
    }
  }

  return NextResponse.json({ ok: true, id: submissionId, persisted: true });
}
