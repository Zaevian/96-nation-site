import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { getSiteSettings } from "@/lib/sanity/queries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Contact",
    description: "Contact 96 Nation for shows, tickets, and Genesis.",
    path: "/contact",
    settings,
  });
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const email =
    settings?.contactEmail?.trim() || "hello@96nation.net";

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Contact</h1>
      <p className="mt-4 max-w-prose text-muted">
        Contact form and details will land with Genesis forms. For now, email{" "}
        <a
          href={`mailto:${email}`}
          className="text-accent underline underline-offset-2"
        >
          {email}
        </a>
        .
      </p>
    </Container>
  );
}
