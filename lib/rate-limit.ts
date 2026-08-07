import "server-only";

/**
 * Optional Upstash rate limit for checkout APIs.
 * When Upstash env is missing, allows all requests (graceful degrade).
 * Caches Ratelimit singleton when configured to avoid connection churn.
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

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

async function getCheckoutLimiter(): Promise<Limiter | null> {
  if (checkoutLimiter !== undefined) {
    return checkoutLimiter;
  }
  if (!isUpstashConfigured()) {
    checkoutLimiter = null;
    return null;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = Redis.fromEnv();
    checkoutLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 m"),
      analytics: false,
      prefix: "rl:checkout",
    });
    return checkoutLimiter;
  } catch (err) {
    console.error("[rate-limit] failed to init Upstash:", err);
    checkoutLimiter = null;
    return null;
  }
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
