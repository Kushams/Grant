import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Only set for the static GitHub Pages preview (served under /<repo>/). Unset in normal use.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  // better-sqlite3 is a native module; keep it out of the bundle.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Pages merged into /fund, /faq and /terms keep working for old links.
  async redirects() {
    return [
      { source: "/about", destination: "/fund", permanent: true },
      { source: "/how-it-works", destination: "/fund#how-it-works", permanent: true },
      { source: "/eligibility", destination: "/fund#who-can-apply", permanent: true },
      { source: "/fraud-prevention", destination: "/faq#safety", permanent: true },
      { source: "/accessibility", destination: "/terms#accessibility", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
