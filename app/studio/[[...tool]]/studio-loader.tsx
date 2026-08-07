"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-load the Studio client graph only when this component mounts.
 * Unconfigured /studio renders the server setup UI without importing Studio.
 */
const Studio = dynamic(
  () => import("./studio").then((m) => m.Studio),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#09090b",
          color: "#a1a1aa",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        Loading Studio…
      </div>
    ),
  },
);

export function StudioLoader() {
  return <Studio />;
}
