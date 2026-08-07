import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PublicForm, contactFields } from "@/components/forms/PublicForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact 96 Nation — questions, press, and general inquiries.",
};

export default function ContactPage() {
  return (
    <Container className="py-12">
      <header className="max-w-prose">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Contact</h1>
        <p className="mt-4 text-muted">
          Prefer email? Reach us at{" "}
          <a
            href="mailto:hello@96nation.net"
            className="text-accent underline underline-offset-2"
          >
            hello@96nation.net
          </a>
          . Or send a message below.
        </p>
      </header>

      <section
        aria-labelledby="contact-form-heading"
        className="mt-10 max-w-xl rounded-lg border border-border bg-surface p-6"
      >
        <h2
          id="contact-form-heading"
          className="text-xl font-semibold tracking-tight text-fg"
        >
          Send a message
        </h2>
        <div className="mt-6">
          <PublicForm
            formType="contact"
            fields={contactFields}
            submitLabel="Send message"
            sourcePath="/contact"
          />
        </div>
      </section>
    </Container>
  );
}
