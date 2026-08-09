import Image from "next/image";
import Link from "next/link";
import { footerNav } from "@/lib/nav";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-4">
          <Image
            src="/brand/96-nation-logo-white.png"
            alt="96 Nation"
            width={72}
            height={90}
            className="h-16 w-auto object-contain"
          />
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
            We are.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Experiences, live music, and local talent out of Tallahassee. Tickets
            for the night. Genesis for the people building it.
          </p>
          <p className="text-sm text-muted">
            <a
              href="mailto:hello@96nation.net"
              className="text-accent underline underline-offset-2 hover:opacity-90"
            >
              hello@96nation.net
            </a>
            <span className="mx-2 text-border">·</span>
            <a
              href="https://www.instagram.com/96nationfl/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted underline underline-offset-2 hover:text-fg"
            >
              @96nationfl
            </a>
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-display inline-flex min-h-11 items-center text-sm font-semibold uppercase tracking-wide text-muted no-underline underline-offset-2 hover:text-fg hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <Container className="border-t border-border py-4">
        <p className="text-xs text-muted">
          © {year} 96 Nation. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
