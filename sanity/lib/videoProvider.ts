/** Shared YouTube/Vimeo host detection for video + event promo fields. */

export type VideoProvider = "youtube" | "vimeo" | "unknown";

/**
 * Detect provider from URL host only (no substring fallbacks).
 * Accepts youtube.com, youtu.be, vimeo.com (and www. variants).
 */
export function detectVideoProvider(
  url: string | undefined | null,
): VideoProvider {
  if (!url) return "unknown";
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
      return "youtube";
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      return "vimeo";
    }
    return "unknown";
  } catch {
    // Fallback for incomplete URLs during typing — host-only regex, no bare includes
    if (/^https?:\/\/(www\.)?(youtube\.com|m\.youtube\.com|youtu\.be)\//i.test(url)) {
      return "youtube";
    }
    if (/^https?:\/\/(www\.)?(vimeo\.com|player\.vimeo\.com)\//i.test(url)) {
      return "vimeo";
    }
    return "unknown";
  }
}

export function isYouTubeOrVimeoUrl(url: string | undefined | null): boolean {
  return detectVideoProvider(url) !== "unknown";
}
