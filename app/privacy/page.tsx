import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Privacy</h1>
      <p className="mt-4 max-w-prose text-muted">
        Privacy policy placeholder. Full policy content will ship with the
        handoff package.
      </p>
    </Container>
  );
}
