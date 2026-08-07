import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Terms</h1>
      <p className="mt-4 max-w-prose text-muted">
        Terms of use placeholder. Full terms will ship with the handoff package.
      </p>
    </Container>
  );
}
