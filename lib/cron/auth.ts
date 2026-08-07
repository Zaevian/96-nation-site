import "server-only";

/**
 * Vercel Cron + manual invoke auth.
 * Prefer Authorization: Bearer ${CRON_SECRET}.
 * Also accepts ?secret= for local curl convenience (same secret).
 */
export function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Misconfigured: deny in production-like envs; allow only when explicitly empty is not set
    // Require CRON_SECRET always when endpoint is hit in deployed envs.
    console.error("[cron] CRON_SECRET is not configured");
    return false;
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) {
    return true;
  }

  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> when configured.
  // Also accept x-cron-secret header.
  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) {
    return true;
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("secret");
    if (q && q === secret) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}
