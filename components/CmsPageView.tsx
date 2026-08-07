import type { ReactNode } from "react";

import { PortableText } from "@/components/PortableText";
import { Container } from "@/components/ui/Container";
import type { CmsPage } from "@/lib/sanity/types";

type CmsPageViewProps = {
  page: CmsPage | null;
  fallbackTitle: string;
  fallbackDescription: string;
  /**
   * When true, skip CMS body even if present is false-path:
   * used so legal pages can show a rich template instead of a one-line stub
   * when the CMS page exists but has no body (or is missing).
   */
  forceFallback?: boolean;
  children?: ReactNode;
};

/**
 * Shared static page shell: CMS title + portable body, or stub / template.
 * Children render after body (or instead of fallbackDescription when provided).
 */
export function CmsPageView({
  page,
  fallbackTitle,
  fallbackDescription,
  forceFallback = false,
  children,
}: CmsPageViewProps) {
  const title = page?.title?.trim() || fallbackTitle;
  const hasBody =
    !forceFallback && Boolean(page?.body && page.body.length > 0);

  return (
    <Container className="py-12">
      <article className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{title}</h1>
        {hasBody ? (
          <div className="mt-6">
            <PortableText value={page!.body} />
          </div>
        ) : fallbackDescription ? (
          <p className="mt-4 max-w-prose text-muted">{fallbackDescription}</p>
        ) : null}
        {children}
      </article>
    </Container>
  );
}
