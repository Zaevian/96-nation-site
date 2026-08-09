"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { primaryNav } from "@/lib/nav";
import { Container } from "@/components/ui/Container";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      queueMicrotask(() => {
        menuButtonRef.current?.focus();
      });
    }
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md">
      <Container className="flex min-h-16 items-center justify-between gap-4 py-2">
        <Link
          href="/"
          className="inline-flex items-center no-underline focus-visible:outline-offset-4"
          aria-label="96 Nation home"
        >
          <Image
            src="/brand/96-nation-logo-white.png"
            alt="96 Nation"
            width={40}
            height={50}
            className="h-11 w-auto object-contain sm:h-12"
            priority
          />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-0.5">
            {primaryNav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`font-display inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide no-underline transition-colors ${
                      active
                        ? "text-accent"
                        : "text-muted hover:text-fg"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border text-fg md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <CloseIcon aria-hidden /> : <MenuIcon aria-hidden />}
        </button>
      </Container>

      <div
        id={menuId}
        className={`border-t border-border bg-surface md:hidden ${
          open ? "block" : "hidden"
        }`}
      >
        <Container>
          <nav aria-label="Primary mobile" className="py-3">
            <ul className="flex flex-col gap-1">
              {primaryNav.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`font-display block min-h-11 rounded-md px-3 py-3 text-base font-semibold uppercase tracking-wide no-underline ${
                        active
                          ? "bg-bg text-accent"
                          : "text-fg hover:bg-bg"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Container>
      </div>
    </header>
  );
}

function MenuIcon({ "aria-hidden": ariaHidden }: { "aria-hidden"?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ "aria-hidden": ariaHidden }: { "aria-hidden"?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
