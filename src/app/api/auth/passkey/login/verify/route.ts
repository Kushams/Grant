import { NextResponse } from "next/server";
import { z } from "zod";
import { startSession } from "@/lib/auth/session";
import { finishPasskeyLogin } from "@/lib/services/passkeys";
import { clearLoginFailures, loginAllowed, recordLoginFailure } from "@/lib/rate-limit";
import { ValidationError } from "@/lib/permissions";
import { can } from "@/lib/permissions";
import { safeNext } from "@/lib/safe-redirect";
import { clientKey, fail, guard } from "../../_shared";

const body = z.object({ token: z.string().min(10).max(100), response: z.any(), next: z.string().optional() });

export async function POST(req: Request) {
  const g = guard(req);
  if ("error" in g) return g.error;
  const key = `passkey|${await clientKey(req)}`;
  try {
    const gate = loginAllowed(key);
    if (!gate.allowed) throw new ValidationError(`Too many failed attempts. Try again in ${Math.ceil(gate.retryAfterSec / 60)} minute(s).`);
    const b = body.parse(await req.json());
    let r;
    try { r = await finishPasskeyLogin(g.rp, b.token, b.response); } catch (e) { recordLoginFailure(key); throw e; }
    clearLoginFailures(key);
    await startSession(r.userId);
    const staff = can(r.role, "admin:access");
    const next = safeNext(b.next);
    const redirectTo = next && (!next.startsWith("/admin") || staff) ? next : staff ? "/admin" : "/dashboard";
    return NextResponse.json({ ok: true, redirectTo });
  } catch (e) { return fail(e); }
}
