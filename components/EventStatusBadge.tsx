type EventStatusBadgeProps = {
  status?: string | null;
  soldOut?: boolean;
  className?: string;
};

/**
 * Cancelled wins over sold-out. Text labels (not color alone) for a11y.
 */
export function EventStatusBadge({
  status,
  soldOut = false,
  className = "",
}: EventStatusBadgeProps) {
  if (status === "cancelled") {
    return (
      <span
        className={`inline-block rounded-md border border-danger/40 bg-danger/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-danger ${className}`}
        role="status"
      >
        Cancelled
      </span>
    );
  }

  if (soldOut) {
    return (
      <span
        className={`inline-block rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted ${className}`}
        role="status"
      >
        Sold out
      </span>
    );
  }

  return null;
}
