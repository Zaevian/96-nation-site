import "server-only";

/**
 * Optional Upstash rate limit for checkout + success APIs.
 * When Upstash env is missing, allows all requests (graceful degrade).
 * Caches Ratelimit singletons when configured to avoid connection churn.
 */

export type RateLimitResult = {
  success: boolean;
  remaining?: number;
  limit?: number;
};

type Limiter = {
  limit: (id: string) => Promise<{
    success: boolean;
    remaining: number;
    limit: number;
  }>;
};

let checkoutLimiter: Limiter | null | undefined;
let successLimiter: Limiter | null | undefined;

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

async function createLimiter(
  prefix: string,
  max: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`,
): Promise<Limiter | null> {
  if (!isUpstashConfigured()) {
    return null;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = Redis.fromEnv();
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window),
      analytics: false,
      prefix,
    });
  } catch (err) {
    console.error("[rate-limit] failed to init Upstash:", err);
    return null;
  }
}

async function getCheckoutLimiter(): Promise<Limiter | null> {
  if (checkoutLimiter !== undefined) {
    return checkoutLimiter;
  }
  checkoutLimiter = await createLimiter("rl:checkout", 10, "10 m");
  return checkoutLimiter;
}

async function getSuccessLimiter(): Promise<Limiter | null> {
  if (successLimiter !== undefined) {
    return successLimiter;
  }
  // Success lookups: 30 / 10 min per IP (DESIGN: rate-limit; no enumerate)
  successLimiter = await createLimiter("rl:success", 30, "10 m");
  return successLimiter;
}

/**
 * Checkout session / RSVP: 10 requests per 10 minutes per IP.
 */
export async function rateLimitCheckout(
  identifier: string,
): Promise<RateLimitResult> {
  try {
    const limiter = await getCheckoutLimiter();
    if (!limiter) {
      return { success: true };
    }

    const result = await limiter.limit(identifier || "anonymous");
    return {
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
    };
  } catch (err) {
    console.error("[rate-limit] Upstash error; allowing request:", err);
    return { success: true };
  }
}

/**
 * Success page lookups: 30 per 10 minutes per IP.
 * Fail-open when Upstash missing (same as checkout) so local/dev works.
 */
export async function rateLimitSuccess(
  identifier: string,
): Promise<RateLimitResult> {
  try {
    const limiter = await getSuccessLimiter();
    if (!limiter) {
      return { success: true };
    }

    const result = await limiter.limit(identifier || "anonymous");
    return {
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
    };
  } catch (err) {
    console.error("[rate-limit] success Upstash error; allowing:", err);
    return { success: true };
  }
}

/** Best-effort client IP from common proxy headers. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Client IP for Server Components (no Request object).
 * Uses next/headers when available.
 */
export async function getClientIpFromHeaders(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = h.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  } catch {
    // not in a request context
  }
  return "unknown";
}
