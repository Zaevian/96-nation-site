import { InstagramIcon } from "@/components/InstagramIcon";
import { ButtonLink } from "@/components/ui/Button";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/social";

type FollowCalloutProps = {
  title?: string;
  description?: string;
  className?: string;
  /** Optional secondary internal link shown next to the follow button. */
  secondaryHref?: string;
  secondaryLabel?: string;
};

/**
 * Instagram follow panel — used where the CMS has nothing to show yet so a fan
 * still has a next step (drops, flyers, and recaps land on IG first).
 */
export function FollowCallout({
  title = "Next drop hits Instagram first",
  description = "Flyers, lineups, and ticket links post on our Instagram before anywhere else. Follow so you don't miss the next night.",
  className = "",
  secondaryHref,
  secondaryLabel,
}: FollowCalloutProps) {
  return (
    <div
      className={`relative flex flex-col justify-center overflow-hidden rounded-xl border border-accent/40 bg-surface px-6 py-8 sm:px-8 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
      />
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        #96Nation
      </p>
      <h2 className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-fg sm:text-2xl">
        {title}
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted sm:text-base">
        {description}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ButtonLink href={INSTAGRAM_URL}>
          <InstagramIcon className="h-4 w-4" />
          Follow {INSTAGRAM_HANDLE}
        </ButtonLink>
        {secondaryHref && secondaryLabel ? (
          <ButtonLink href={secondaryHref} variant="secondary">
            {secondaryLabel}
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
