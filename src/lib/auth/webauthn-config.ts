import { ORG } from "@/config/organization";

export type RelyingParty = { rpID: string; origin: string; rpName: string };

/**
 * Relying-party settings. In production set WEBAUTHN_ORIGIN (e.g. https://example.org) so the origin is
 * never derived from request headers. Locally it is derived from the Host header (localhost is allowed).
 */
export function getRelyingParty(req: Request): RelyingParty {
  const fixed = process.env.WEBAUTHN_ORIGIN;
  if (fixed) {
    const u = new URL(fixed);
    return { rpID: process.env.WEBAUTHN_RP_ID || u.hostname, origin: u.origin, rpName: ORG.name };
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost";
  const hostname = host.split(":")[0];
  const proto = req.headers.get("x-forwarded-proto") ?? (hostname === "localhost" || hostname === "127.0.0.1" ? "http" : "https");
  return { rpID: hostname, origin: `${proto}://${host}`, rpName: ORG.name };
}

/** Cheap CSRF guard for JSON endpoints: a browser always sends Origin on cross-site POSTs. */
export function sameOrigin(req: Request, rp: RelyingParty): boolean {
  const o = req.headers.get("origin");
  return !o || o === rp.origin;
}
