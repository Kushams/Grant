import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { runExport } from "@/lib/services/exports";
import { ForbiddenError, ValidationError } from "@/lib/permissions";

/**
 * CSV download. Authorization is re-checked here (and again in runExport). Cross-site
 * navigations are refused so another website cannot trigger an audited export.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ type: string }> }) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return new NextResponse("Forbidden", { status: 403 });
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { type } = await ctx.params;
  try {
    const out = await runExport({ id: user.id, role: user.role, name: user.name }, type);
    return new NextResponse(out.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${out.filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    if (e instanceof ForbiddenError) return new NextResponse("Forbidden", { status: 403 });
    if (e instanceof ValidationError) return new NextResponse("Unknown export type", { status: 404 });
    console.error("[export error]", e);
    return new NextResponse("Export failed", { status: 500 });
  }
}
