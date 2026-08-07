import type { ReactNode } from "react";

import { PortableText } from "@/components/PortableText";
import { Container } from "@/components/ui/Container";
import type { CmsPage } from "@/lib/sanity/types";

type CmsPageViewProps = {
  page: CmsPage | null;
  fallbackTitle: string;
  fallbackDescription: string;
  children?: ReactNode;
};

/**
 * Shared static page shell: CMS title + portable body, or stub copy.
 */
export function CmsPageView({
  page,
  fallbackTitle,
  fallbackDescription,
  children,
}: CmsPageViewProps) {
  const title = page?.title?.trim() || fallbackTitle;
  const hasBody = Boolean(page?.body && page.body.length > 0);

  return (
    <Container className="py-12">
      <article className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{title}</h1>
        {hasBody ? (
          <div className="mt-6">
            <PortableText value={page!.body} />
          </div>
        ) : (
          <p className="mt-4 max-w-prose text-muted">{fallbackDescription}</p>
        )}
        {children}
      </article>
    </Container>
  );
}
