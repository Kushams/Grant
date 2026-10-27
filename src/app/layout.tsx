import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ORG } from "@/config/organization";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FlashRegion } from "@/components/ui/flash";

// Every page reads the session cookie (header) and/or the database, so render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: `${ORG.name} — ${ORG.tagline}`, template: `%s | ${ORG.name}` },
  description: ORG.description,
  applicationName: ORG.name,
  robots: { index: false, follow: false }, // prototype: keep out of search engines
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1b3256" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="skip-link">Skip to main content</a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <SiteFooter />
        <FlashRegion />
      </body>
    </html>
  );
}
