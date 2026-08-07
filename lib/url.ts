/**
 * Runtime URL allowlist for CMS-driven links (defense-in-depth beyond Studio rules).
 * Allowed: absolute http/https, mailto, tel, and same-origin relative paths starting with `/`
 * (single slash only — rejects protocol-relative `//…`).
 */

const ALLOWED_ABSOLUTE =
  /^(https?:|mailto:|tel:)/i;

/** True for safe relative paths: `/foo`, `/foo?x=1#y` — not `//evil.com`. */
function isSafeRelativePath(href: string): boolean {
  if (!href.startsWith("/")) return false;
  if (href.startsWith("//")) return false;
  // Reject backslash tricks and control chars
  if (/[\\\u0000-\u001F\u007F]/.test(href)) return false;
  return true;
}

/**
 * Normalize and allowlist a CMS href.
 * Returns a safe URL string, or `null` if the value must not be rendered as a link.
 */
export function sanitizeHref(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const href = raw.trim();
  if (!href) return null;

  // Block scheme-like values with leading whitespace tricks already trimmed;
  // also reject mixed-case javascript: / data: after lowercasing the scheme prefix.
  const lower = href.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }

  if (ALLOWED_ABSOLUTE.test(href)) {
    return href;
  }

  if (isSafeRelativePath(href)) {
    return href;
  }

  return null;
}

/**
 * Like sanitizeHref, but falls back to a known-safe path when invalid.
 */
export function sanitizeHrefOrFallback(
  raw: string | null | undefined,
  fallback: string,
): string {
  return sanitizeHref(raw) ?? fallback;
}
