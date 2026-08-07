import "server-only";

/**
 * Lightweight Sentry helpers.
 * Init runs from instrumentation.ts only when SENTRY_DSN is set.
 * Capture is no-op (console only) without DSN so builds/tests need no secrets.
 */

let sentryReady = false;

export function isSentryConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

/**
 * Initialize @sentry/node when DSN present.
 * Safe to call multiple times; subsequent calls no-op after first success.
 */
export async function initSentry(): Promise<void> {
  if (sentryReady || !isSentryConfigured()) return;

  const dsn = process.env.SENTRY_DSN!.trim();
  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn,
      tracesSampleRate: 0,
      environment:
        process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    });
    sentryReady = true;
  } catch (err) {
    console.error("[sentry] init failed:", err);
  }
}

export async function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const err =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : JSON.stringify(error));

  if (context) {
    console.error("[sentry]", err.message, context);
  } else {
    console.error("[sentry]", err);
  }

  if (!isSentryConfigured()) return;

  try {
    if (!sentryReady) {
      await initSentry();
    }
    const Sentry = await import("@sentry/node");
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(err);
    });
  } catch (captureErr) {
    console.error("[sentry] capture failed:", captureErr);
  }
}

export async function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "error",
  context?: Record<string, unknown>,
): Promise<void> {
  console[level === "warning" ? "warn" : level === "info" ? "info" : "error"](
    "[sentry]",
    message,
    context ?? "",
  );

  if (!isSentryConfigured()) return;

  try {
    if (!sentryReady) {
      await initSentry();
    }
    const Sentry = await import("@sentry/node");
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureMessage(message, level);
    });
  } catch (captureErr) {
    console.error("[sentry] captureMessage failed:", captureErr);
  }
}
