import { SiteShell } from "@/components/SiteShell";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFoundPage() {
  return (
    <SiteShell>
      <Container className="py-16">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-accent">
            404
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Page not found
          </h1>
          <p className="mt-4 text-muted">
            That link may be broken or the content was moved. Try the events list
            or head home.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/events">Browse events</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Back home
            </ButtonLink>
          </div>
        </div>
      </Container>
    </SiteShell>
  );
}
