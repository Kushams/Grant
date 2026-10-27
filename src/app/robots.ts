import type { MetadataRoute } from "next";

// Prototype: ask crawlers not to index anything. Replace when a real site is launched.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
