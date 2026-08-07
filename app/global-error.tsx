"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Root layout error boundary — must define its own html/body.
 * Minimal styles so it still works if globals fail to load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#a3a3a3", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
            A critical error occurred. Please try again or return home.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#a3a3a3",
                marginBottom: "1.5rem",
              }}
            >
              Ref: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: "2.75rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                background: "#5eead4",
                color: "#042f2e",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                minHeight: "2.75rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #262626",
                background: "#141414",
                color: "#f5f5f5",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
