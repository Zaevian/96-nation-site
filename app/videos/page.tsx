import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Videos",
};

export default function VideosPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Videos</h1>
      <p className="mt-4 max-w-prose text-muted">
        Promo and show videos (YouTube/Vimeo embeds) will appear here. Stub for
        primary navigation.
      </p>
    </Container>
  );
}
