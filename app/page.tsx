import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl space-y-6">
        <p className="text-sm font-medium uppercase tracking-wider text-accent">
          Tallahassee · All-ages shows
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          96 Nation — tickets, talent, and Genesis
        </h1>
        <p className="text-base text-muted sm:text-lg">
          Mobile-first ticketing hub for local music. Browse events, grab
          tickets, explore galleries and videos, or connect through Genesis.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/events">View events</ButtonLink>
          <ButtonLink href="/genesis" variant="secondary">
            Genesis
          </ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            Contact
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
