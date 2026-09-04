import type { Metadata } from "next";
import { Jost, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { getSiteSettings } from "@/lib/sanity/queries";
import { buildRootMetadata } from "@/lib/seo";
import "./globals.css";

/**
 * Style guide: Futura PT Heavy (headers) / Futura PT Medium (logo type).
 * Jost is a free geometric stand-in when Futura PT is not installed locally.
 * Body: Cambria Math (system) with Source Serif 4 as web fallback.
 */
const display = Jost({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Source_Serif_4({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildRootMetadata(settings);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
