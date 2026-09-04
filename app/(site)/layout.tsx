import type { ReactNode } from "react";

import { SiteShell } from "@/components/SiteShell";

/**
 * Marketing / public site chrome (header, footer, skip link).
 * Studio and admin live outside this route group.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
