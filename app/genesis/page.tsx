import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Genesis",
};

export default function GenesisPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">
        96 Nation: Genesis
      </h1>
      <p className="mt-4 max-w-prose text-muted">
        Signups, service inquiries, and community forms will live here. Stub
        page for navigation and landmark structure.
      </p>
    </Container>
  );
}
