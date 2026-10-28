import { NextResponse } from "next/server";
import { getActor } from "@/lib/auth/session";
import { beginPasskeyRegistration } from "@/lib/services/passkeys";
import { fail, guard } from "../../_shared";

export async function POST(req: Request) {
  const g = guard(req);
  if ("error" in g) return g.error;
  try {
    const { options, token } = await beginPasskeyRegistration(await getActor(), g.rp);
    return NextResponse.json({ ok: true, options, token });
  } catch (e) { return fail(e); }
}
