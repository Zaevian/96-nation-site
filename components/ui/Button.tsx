import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent-fill text-accent-fg hover:opacity-90 border border-transparent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-fill)_40%,transparent)]",
  secondary:
    "bg-transparent text-fg border border-border hover:border-accent hover:text-accent",
  ghost: "bg-transparent text-muted border border-transparent hover:text-fg hover:bg-surface",
};

const base =
  "font-display inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide no-underline transition-colors min-h-11 min-w-11 disabled:opacity-50 disabled:pointer-events-none";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
