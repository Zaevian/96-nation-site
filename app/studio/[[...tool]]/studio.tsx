"use client";

import { NextStudio } from "next-sanity/studio";

import config from "@/sanity.config";

/** Client-only Studio shell (loaded when Sanity env is configured). */
export function Studio() {
  return <NextStudio config={config} />;
}
