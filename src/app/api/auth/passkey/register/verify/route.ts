import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/auth/session";
import { finishPasskeyRegistration } from "@/lib/services/passkeys";
import { fail, guard } from "../../_shared";

const body = z.object({ token: z.string().min(10).max(100), response: z.any(), label: z.string().max(60).optional() });

export async function POST(req: Request) {
  const g = guard(req);
  if ("error" in g) return g.error;
  try {
    const b = body.parse(await req.json());
    await finishPasskeyRegistration(await getActor(), g.rp, b.token, b.response, b.label);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
