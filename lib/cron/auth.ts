import "server-only";

import { authorizeBearer } from "@/lib/security/secrets";

/**
 * Vercel Cron auth — Authorization: Bearer ${CRON_SECRET} only.
 * Query-string secrets removed (leak via logs / proxies).
 */
export function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("[cron] CRON_SECRET is not configured");
    return false;
  }

  const auth = request.headers.get("authorization");
  if (authorizeBearer(auth, secret)) {
    return true;
  }

  return false;
}
