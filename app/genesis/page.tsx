import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import {
  PublicForm,
  serviceInquiryFields,
  signupFields,
} from "@/components/forms/PublicForm";

export const metadata: Metadata = {
  title: "Genesis",
  description:
    "Genesis by 96 Nation helps Tallahassee talent with creative and media support. Sign up or send a service inquiry.",
};

export default function GenesisPage() {
  return (
    <Container className="py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          96 Nation
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-fg sm:text-4xl">
          Genesis
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
          Genesis is here to help local Tallahassee talent take the next step.
          Creative work, media, production, booking questions. Get on the list
          or tell us what you need.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section
          aria-labelledby="signup-heading"
          className="rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <h2
            id="signup-heading"
            className="font-display text-xl font-bold uppercase tracking-tight text-fg"
          >
            Community signup
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Shows, community nights, Genesis news. Stay in the loop.
          </p>
          <div className="mt-6">
            <PublicForm
              formType="signup"
              fields={signupFields}
              submitLabel="Join Genesis"
              sourcePath="/genesis"
            />
          </div>
        </section>

        <section
          aria-labelledby="service-heading"
          className="rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <h2
            id="service-heading"
            className="font-display text-xl font-bold uppercase tracking-tight text-fg"
          >
            Service inquiry
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Tell us what you need. We&apos;ll follow up by email or phone.
          </p>
          <div className="mt-6">
            <PublicForm
              formType="service_inquiry"
              fields={serviceInquiryFields}
              submitLabel="Send inquiry"
              sourcePath="/genesis"
            />
          </div>
        </section>
      </div>
    </Container>
  );
}
