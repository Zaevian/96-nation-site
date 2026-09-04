"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Segment error boundary — catches render errors under the root layout.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-accent">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          We hit an unexpected error
        </h1>
        <p className="mt-4 text-muted">
          Please try again. If the problem continues, contact us and include the
          reference below when available.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted">
            Ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary">
            Back home
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
