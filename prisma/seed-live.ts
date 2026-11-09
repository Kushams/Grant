/**
 * Live (non-demo) bootstrap. Creates ONE administrator from environment variables plus a DRAFT, unpublished
 * "General Opportunity Fund" record (USD 25,000–500,000 request range). No sample applicants, no demo accounts.
 *
 *   ADMIN_EMAIL=...  ADMIN_NAME="..."  ADMIN_PASSWORD='<12+ chars>'  npm run db:seed:live
 *
 * Opportunities are then created in the admin area and can only be published after the LIVE
 * verification checklist (verified funder, approved terms, fee policy) is completed.
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";
import { saveOpportunity } from "../src/lib/services/opportunities";
import { GENERAL_FUND_INPUT } from "../src/config/general-fund";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME).");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  if (await db.user.findUnique({ where: { email } })) throw new Error("A user with that email already exists.");
  const admin = await db.user.create({ data: { name, email, role: "ADMIN", isDemo: false, passwordHash: await hashPassword(password) } });
  await saveOpportunity({ id: admin.id, role: "ADMIN", name }, null, GENERAL_FUND_INPUT, "LIVE");
  console.log(`Created administrator ${email} and a DRAFT General Opportunity Fund (not published; complete the LIVE verification checklist in /admin/opportunities to publish).`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); }).finally(() => db.$disconnect());
