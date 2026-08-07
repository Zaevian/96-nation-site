import type { Metadata, Viewport } from "next";
import { metadata as studioMetadata } from "next-sanity/studio";

import { isSanityConfigured } from "@/lib/sanity/env";
import { StudioLoader } from "./studio-loader";

export const dynamic = "force-static";

export const metadata: Metadata = {
  ...studioMetadata,
  title: "96 Nation Studio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

/**
 * Embedded Sanity Studio at /studio.
 * When Sanity env is missing, show setup messaging so the app still builds and deploys.
 * Studio JS is loaded only via StudioLoader (dynamic import) on the configured path.
 */
export default function StudioPage() {
  if (!isSanityConfigured()) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#09090b",
          color: "#fafafa",
        }}
      >
        <div style={{ maxWidth: 520, lineHeight: 1.5 }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Sanity Studio is not configured
          </h1>
          <p style={{ color: "#a1a1aa", marginBottom: "1rem" }}>
            Set the following environment variables, then restart the dev
            server. Create a free project at{" "}
            <a
              href="https://www.sanity.io/manage"
              style={{ color: "#34d399" }}
            >
              sanity.io/manage
            </a>
            .
          </p>
          <pre
            style={{
              background: "#18181b",
              padding: "1rem",
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
              color: "#e4e4e7",
            }}
          >
            {`NEXT_PUBLIC_SANITY_PROJECT_ID=yourProjectId
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
# optional for draft preview:
SANITY_API_READ_TOKEN=`}
          </pre>
          <p style={{ color: "#71717a", marginTop: "1rem", fontSize: 14 }}>
            Seed and schema notes:{" "}
            <code style={{ color: "#d4d4d8" }}>docs/SANITY.md</code>
          </p>
        </div>
      </main>
    );
  }

  return <StudioLoader />;
}
