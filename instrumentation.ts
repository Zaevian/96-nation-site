/**
 * Next.js instrumentation — runs once per server runtime boot.
 * Sentry is initialized only when SENTRY_DSN is set (no secrets required for build).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dsn = process.env.SENTRY_DSN?.trim();
    if (dsn) {
      const { initSentry } = await import("./lib/sentry");
      await initSentry();
    }
  }
}
