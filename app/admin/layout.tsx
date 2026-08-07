import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-border bg-surface/50">
      <Container className="flex flex-wrap items-center gap-4 py-3 text-sm">
        <span className="font-semibold text-fg">Admin</span>
        <nav aria-label="Admin" className="flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="text-muted no-underline hover:text-accent"
          >
            Orders
          </Link>
          <Link
            href="/admin/forms"
            className="text-muted no-underline hover:text-accent"
          >
            Forms
          </Link>
          <Link
            href="/admin/login"
            className="text-muted no-underline hover:text-accent"
          >
            Login
          </Link>
        </nav>
      </Container>
      {children}
    </div>
  );
}
