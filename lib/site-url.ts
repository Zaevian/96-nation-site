/**
 * Canonical absolute site origin (no trailing slash).
 * Prefer NEXT_PUBLIC_SITE_URL, then Vercel production host, then 96nation.net.
 * Never fall back to the *.vercel.app preview host.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`
      : "",
  ];
  for (const raw of candidates) {
    const fromEnv = (raw ?? "").trim().replace(/\/+$/, "");
    if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
      return fromEnv;
    }
  }
  // Local/dev without env: localhost. Production/Vercel: canonical custom domain.
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "https://96nation.net";
  }
  return "http://localhost:3000";
}
