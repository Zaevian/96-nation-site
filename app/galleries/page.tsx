import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Galleries",
};

export default function GalleriesPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Galleries</h1>
      <p className="mt-4 max-w-prose text-muted">
        Photo galleries will be loaded from the CMS in a later PR. Stub for
        primary navigation.
      </p>
    </Container>
  );
}
