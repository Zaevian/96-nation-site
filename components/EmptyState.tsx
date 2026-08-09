import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  /** Optional primary action (e.g. link home or to contact). */
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Polished empty / zero-results state for list pages.
 */
export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`mt-10 rounded-xl border border-border bg-surface px-6 py-10 text-center sm:px-10 ${className}`}
      role="status"
    >
      <h2 className="font-display text-lg font-bold uppercase tracking-tight text-fg">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-prose text-sm leading-relaxed text-muted">
        {description}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
      {actionHref && actionLabel ? (
        <div className="mt-6 flex justify-center">
          <ButtonLink href={actionHref} variant="secondary">
            {actionLabel}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
