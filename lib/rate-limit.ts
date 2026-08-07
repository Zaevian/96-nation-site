import "server-only";

/**
 * Rate limit helper for form (and future checkout) endpoints.
 *
 * Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN so limits
 * are shared across Vercel isolates. Without Upstash, an in-memory per-instance
 * sliding window is used (dev/build only — not multi-instance safe).
 *
 * Client IP: first `x-forwarded-for` hop / `x-real-ip`. Correct behind Vercel
 * (or any proxy that overwrites client-supplied forwarded headers). Do not
 * expose the app without a trusted proxy if you rely on these headers for limits.
 */

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_LIMIT = 5;
const MEMORY_PRUNE_EVERY = 64;

/** Per-instance sliding window (dev / missing Upstash). */
const memoryHits = new Map<string, number[]>();
let memoryOps = 0;

function pruneMemory(now: number, windowMs: number) {
  for (const [key, timestamps] of memoryHits) {
    const kept = timestamps.filter((t) => now - t < windowMs);
    if (kept.length === 0) {
      memoryHits.delete(key);
    } else {
      memoryHits.set(key, kept);
    }
  }
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): LimitResult {
  const now = Date.now();
  memoryOps += 1;
  if (memoryOps % MEMORY_PRUNE_EVERY === 0) {
    pruneMemory(now, windowMs);
  }

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

type RatelimitInstance = {
  limit: (key: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
};

/** Lazy singleton per isolate — avoid constructing Redis/Ratelimit every request. */
let upstashClient: RatelimitInstance | null | undefined;
let upstashLimit = DEFAULT_LIMIT;
let upstashWindowMs = WINDOW_MS;

async function getUpstashRatelimit(
  limit: number,
  windowMs: number,
): Promise<RatelimitInstance | null> {
  if (!hasUpstashEnv()) return null;

  // Rebuild if limit/window change (rare; forms use fixed defaults)
  if (
    upstashClient &&
    upstashLimit === limit &&
    upstashWindowMs === windowMs
  ) {
    return upstashClient;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = Redis.fromEnv();
    const duration =
      windowMs === WINDOW_MS
        ? ("10 m" as const)
        : (`${Math.max(1, Math.round(windowMs / 1000))} s` as `${number} s`);

    upstashClient = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, duration),
      analytics: false,
      prefix: "96nation",
    });
    upstashLimit = limit;
    upstashWindowMs = windowMs;
    return upstashClient;
  } catch (err) {
    console.error("[rate-limit] Upstash init failed", err);
    upstashClient = null;
    return null;
  }
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
    const ratelimit = await getUpstashRatelimit(limit, windowMs);
    if (!ratelimit) {
      return memoryLimit(key, limit, windowMs);
    }

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

/**
 * Client IP from proxy headers. Prefer deployment behind Vercel (or another
 * edge that sets/overwrites `x-forwarded-for` / `x-real-ip`). Spoofable if
 * clients can set those headers without a trusted proxy in front.
 */
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
