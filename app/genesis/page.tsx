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
    <Container className="py-12">
      <header className="max-w-prose">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          96 Nation: Genesis
        </h1>
        <p className="mt-4 text-muted">
          Genesis is here to help local Tallahassee talent take the next step.
          Sign up for community updates, or ask about production, booking, and
          media work.
        </p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <section
          aria-labelledby="signup-heading"
          className="rounded-lg border border-border bg-surface p-6"
        >
          <h2
            id="signup-heading"
            className="text-xl font-semibold tracking-tight text-fg"
          >
            Community signup
          </h2>
          <p className="mt-2 text-sm text-muted">
            Get on the list for shows, community nights, and Genesis news.
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
          className="rounded-lg border border-border bg-surface p-6"
        >
          <h2
            id="service-heading"
            className="text-xl font-semibold tracking-tight text-fg"
          >
            Service inquiry
          </h2>
          <p className="mt-2 text-sm text-muted">
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
