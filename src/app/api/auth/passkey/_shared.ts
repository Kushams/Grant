import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError, ValidationError } from "@/lib/permissions";
import { getRelyingParty, sameOrigin, type RelyingParty } from "@/lib/auth/webauthn-config";

export function guard(req: Request): { rp: RelyingParty } | { error: NextResponse } {
  const rp = getRelyingParty(req);
  if (!sameOrigin(req, rp)) return { error: NextResponse.json({ ok: false, message: "Request blocked." }, { status: 403 }) };
  return { rp };
}

export function fail(err: unknown): NextResponse {
  if (err instanceof ValidationError || err instanceof ForbiddenError) return NextResponse.json({ ok: false, message: err.message }, { status: err instanceof ForbiddenError ? 403 : 400 });
  if (err instanceof ZodError) return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  console.error("[passkey error]", err);
  return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
}

export async function clientKey(req: Request): Promise<string> {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}
