import "server-only";

/**
 * Rate limit helpers for forms, checkout, and success APIs.
 *
 * Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN so limits
 * are shared across Vercel isolates.
 *
 * Forms (rateLimit): without Upstash, falls back to in-memory per-instance
 * sliding window (dev only — not multi-instance safe).
 * Checkout / success: without Upstash, allows all requests (graceful degrade).
 */

export type RateLimitResult = {
  success: boolean;
  remaining?: number;
  limit?: number;
  reset?: number;
};

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_FORM_LIMIT = 5;
const MEMORY_PRUNE_EVERY = 64;

/** Per-instance sliding window (forms when Upstash missing). */
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

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

type Limiter = {
  limit: (id: string) => Promise<{
    success: boolean;
    remaining: number;
    limit: number;
    reset: number;
  }>;
};

let checkoutLimiter: Limiter | null | undefined;
let successLimiter: Limiter | null | undefined;
let formsLimiter: Limiter | null | undefined;
let formsLimitConfig = DEFAULT_FORM_LIMIT;
let formsWindowMs = WINDOW_MS;

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
  successLimiter = await createLimiter("rl:success", 30, "10 m");
  return successLimiter;
}

async function getFormsLimiter(
  limit: number,
  windowMs: number,
): Promise<Limiter | null> {
  if (
    formsLimiter !== undefined &&
    formsLimitConfig === limit &&
    formsWindowMs === windowMs
  ) {
    return formsLimiter;
  }

  const duration =
    windowMs === WINDOW_MS
      ? ("10 m" as const)
      : (`${Math.max(1, Math.round(windowMs / 1000))} s` as `${number} s`);

  formsLimiter = await createLimiter("rl:forms", limit, duration);
  formsLimitConfig = limit;
  formsWindowMs = windowMs;
  return formsLimiter;
}

/**
 * Generic rate limit by key (e.g. `forms:signup:1.2.3.4`).
 * Default: 5 requests / 10 minutes (DESIGN.md forms).
 * Falls back to in-memory when Upstash is missing.
 */
export async function rateLimit(
  key: string,
  limit: number = DEFAULT_FORM_LIMIT,
  windowMs: number = WINDOW_MS,
): Promise<LimitResult> {
  if (!isUpstashConfigured()) {
    return memoryLimit(key, limit, windowMs);
  }

  try {
    const limiter = await getFormsLimiter(limit, windowMs);
    if (!limiter) {
      return memoryLimit(key, limit, windowMs);
    }

    const result = await limiter.limit(key);
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
 * Checkout session / RSVP: 10 requests per 10 minutes per IP.
 * Fail-open when Upstash missing.
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
      reset: result.reset,
    };
  } catch (err) {
    console.error("[rate-limit] Upstash error; allowing request:", err);
    return { success: true };
  }
}

/**
 * Success page lookups: 30 per 10 minutes per IP.
 * Fail-open when Upstash missing.
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
      reset: result.reset,
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

/** Alias used by forms API (PR 8). */
export function clientIp(request: Request): string {
  return getClientIp(request);
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
