import {
  PortableText as PortableTextReact,
  type PortableTextComponents,
  type PortableTextBlock,
} from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";

import { urlForImage } from "@/lib/sanity/image";
import type { SanityImage } from "@/lib/sanity/types";
import { sanitizeHref } from "@/lib/url";

type PortableTextProps = {
  value?: PortableTextBlock[] | null;
  className?: string;
};

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 max-w-prose text-base leading-relaxed text-muted last:mb-0">
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 text-2xl font-bold tracking-tight text-fg first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 text-xl font-semibold tracking-tight text-fg first:mt-0">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-4 border-accent pl-4 text-muted italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-disc space-y-1 pl-6 text-muted">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-1 pl-6 text-muted">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-fg">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const href = sanitizeHref(value?.href as string | undefined);
      const openInNewTab = Boolean(value?.openInNewTab);

      // Unsafe / empty href: render children as plain text (no anchor)
      if (!href) {
        return <span>{children}</span>;
      }

      const isExternal =
        /^https?:/i.test(href) ||
        href.toLowerCase().startsWith("mailto:") ||
        href.toLowerCase().startsWith("tel:");

      if (isExternal) {
        return (
          <a
            href={href}
            className="text-accent underline underline-offset-2 hover:opacity-90"
            {...(openInNewTab
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {children}
          </a>
        );
      }

      return (
        <Link
          href={href}
          className="text-accent underline underline-offset-2 hover:opacity-90"
        >
          {children}
        </Link>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const image = value as SanityImage | undefined;
      if (!image) return null;
      const src = urlForImage(image)?.width(1200).url();
      if (!src) return null;

      // Prefer CMS alt; fall back to caption. Skip image if neither (a11y).
      const alt = image.alt?.trim() || image.caption?.trim() || "";
      if (!alt) {
        return null;
      }

      return (
        <figure className="my-6">
          <div className="relative aspect-[16/10] w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-surface">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
          {image.caption ? (
            <figcaption className="mt-2 text-sm text-muted">
              {image.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    },
  },
};

/**
 * Allowlisted portable text renderer (blocks, lists, links, images with alt).
 * Link hrefs are re-validated at render time (http/https/mailto/tel + relative `/…`).
 * Renders nothing when value is empty so callers can show fallbacks.
 */
export function PortableText({ value, className = "" }: PortableTextProps) {
  if (!value || value.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <PortableTextReact value={value} components={components} />
    </div>
  );
}
