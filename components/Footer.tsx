import Link from "next/link";
import { footerNav } from "@/lib/nav";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="text-base font-bold text-fg">96 Nation</p>
          <p className="text-sm text-muted">
            Tallahassee-area music and local talent. Tickets, Genesis, and
            community — mobile-first.
          </p>
          <p className="text-sm text-muted">
            <a
              href="mailto:hello@96nation.net"
              className="text-accent underline underline-offset-2 hover:opacity-90"
            >
              hello@96nation.net
            </a>
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted no-underline hover:text-fg underline-offset-2 hover:underline min-h-11 inline-flex items-center"
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
          © {year} 96 Nation. All rights reserved. Placeholder brand tokens —
          AA contrast documented in{" "}
          <code className="text-fg">app/globals.css</code>.
        </p>
      </Container>
    </footer>
  );
}
