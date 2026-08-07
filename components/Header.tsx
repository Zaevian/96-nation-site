"use client";

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
      // Defer until panel is hidden so focus is not left on a display:none node
      queueMicrotask(() => {
        menuButtonRef.current?.focus();
      });
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes menu and restores focus to the toggle (disclosure pattern)
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
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm">
      <Container className="flex min-h-14 items-center justify-between gap-4 py-2">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-fg no-underline hover:text-accent"
        >
          96 Nation
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors min-h-11 inline-flex items-center ${
                      active
                        ? "text-accent underline underline-offset-4"
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

        {/* Mobile menu toggle */}
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border text-fg md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? (
            <CloseIcon aria-hidden />
          ) : (
            <MenuIcon aria-hidden />
          )}
        </button>
      </Container>

      {/* Mobile panel — simple disclosure (no modal focus trap / body scroll lock) */}
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
                      className={`block rounded-md px-3 py-3 text-base font-medium no-underline min-h-11 ${
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
