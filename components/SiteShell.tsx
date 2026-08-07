import type { ReactNode } from "react";
import { SkipLink } from "@/components/SkipLink";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type SiteShellProps = {
  children: ReactNode;
};

/** Global landmarks: skip link, header, main, footer */
export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
