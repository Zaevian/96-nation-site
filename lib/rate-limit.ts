import "server-only";

/**
 * Rate limit helper for form (and future checkout) endpoints.
 * Uses Upstash when env is set; falls back to in-memory for local/dev/build.
 */

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_LIMIT = 5;

/** Per-instance sliding window (dev / missing Upstash). */
const memoryHits = new Map<string, number[]>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): LimitResult {
  const now = Date.now();
  const timestamps = (memoryHits.get(key) ?? []).filter(
    (t) => now - t < windowMs,
  );

  if (timestamps.length >= limit) {
    memoryHits.set(key, timestamps);
    const oldest = timestamps[0] ?? now;
    return {
      success: false,
      limit,
      remaining: 0,
      reset: oldest + windowMs,
    };
  }

  timestamps.push(now);
  memoryHits.set(key, timestamps);
  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - timestamps.length),
    reset: now + windowMs,
  };
}

function hasUpstashEnv(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

/**
 * Rate limit by key (e.g. `forms:signup:1.2.3.4`).
 * Default: 5 requests / 10 minutes (DESIGN.md forms).
 */
export async function rateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = WINDOW_MS,
): Promise<LimitResult> {
  if (!hasUpstashEnv()) {
    return memoryLimit(key, limit, windowMs);
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = Redis.fromEnv();
    // windowMs is fixed at 10m for forms; map to sliding window duration
    const duration =
      windowMs === WINDOW_MS
        ? "10 m"
        : (`${Math.max(1, Math.round(windowMs / 1000))} s` as `${number} s`);

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, duration),
      analytics: false,
      prefix: "96nation",
    });

    const result = await ratelimit.limit(key);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    console.error("[rate-limit] Upstash failed, using memory fallback", err);
    return memoryLimit(key, limit, windowMs);
  }
}

/** Client IP from common proxy headers (Vercel / reverse proxy). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
