import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/brand/96-nation-logo-white.png";

type BrandLogoProps = {
  /** Visual height in pixels (width scales with asset ratio ~0.8). */
  height?: number;
  className?: string;
  /** Link to home (default true). */
  linked?: boolean;
  priority?: boolean;
};

/**
 * Official 96 Nation wordmark (white). Use on dark backgrounds only.
 * Asset: public/brand/96-nation-logo-white.png (Style Guide primary logo).
 */
export function BrandLogo({
  height = 48,
  className = "",
  linked = true,
  priority = false,
}: BrandLogoProps) {
  // Source is 1396×1748 (portrait stack). Keep aspect.
  const width = Math.round(height * (1396 / 1748));

  const img = (
    <Image
      src={LOGO_SRC}
      alt="96 Nation"
      width={width}
      height={height}
      className={`h-auto w-auto object-contain ${className}`}
      style={{ height, width: "auto" }}
      priority={priority}
    />
  );

  if (!linked) return img;

  return (
    <Link
      href="/"
      className="inline-flex items-center no-underline focus-visible:outline-offset-4"
      aria-label="96 Nation home"
    >
      {img}
    </Link>
  );
}
