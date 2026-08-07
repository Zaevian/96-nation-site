import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Contact</h1>
      <p className="mt-4 max-w-prose text-muted">
        Contact form and details will land with Genesis forms. For now, email{" "}
        <a
          href="mailto:hello@96nation.net"
          className="text-accent underline underline-offset-2"
        >
          hello@96nation.net
        </a>
        .
      </p>
    </Container>
  );
}
