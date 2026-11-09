import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { hashPassword } from "../auth/password";
import { clearLoginFailures, loginAllowed, recordLoginFailure } from "../rate-limit";
import { ForbiddenError, ValidationError, type Actor } from "../permissions";
import { generateAccessCode, hashAccessCode, normalizeAccessCode, quickEmail } from "../auth/access-code";
import { isApplicantRole } from "../constants";
import { ORG } from "@/config/organization";
import { recordAudit } from "./audit";
import { notify } from "./notifications";

const quickStartSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  consentPrivacy: z.literal(true, { error: "You need to acknowledge the privacy notice to continue." }),
});

/** Creates an individual applicant with no email/password. Returns the access code ONCE. */
export async function createQuickAccount(raw: unknown): Promise<{ userId: string; role: string; code: string }> {
  const input = quickStartSchema.parse(raw);
  const code = generateAccessCode();
  const passwordHash = await hashPassword(randomBytes(32).toString("base64url")); // unusable: nobody knows it
  const user = await db.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: quickEmail(randomBytes(9).toString("hex")), name: input.name, passwordHash, role: "INDIVIDUAL_APPLICANT",
        isQuickAccount: true, accessCodeHash: hashAccessCode(normalizeAccessCode(code)!), accessCodeCreatedAt: new Date(),
      },
    });
    await tx.individualProfile.create({ data: { userId: u.id, fullName: input.name, interests: "[]" } });
    await tx.consentRecord.create({ data: { userId: u.id, subject: "REGISTRATION", documentVersion: ORG.policyVersion } });
    await recordAudit({ actor: { id: u.id, role: u.role as Actor["role"], name: u.name }, action: "user.quick_registered", entityType: "User", entityId: u.id, summary: "Quick account created (passkey / access code)" }, tx);
    await notify({ userId: u.id, type: "WELCOME", title: "Welcome to National Empowerment Network", body: "Keep your access code somewhere safe and add a passkey on this device. Applying never guarantees funding.", href: "/dashboard/security" }, tx);
    return u;
  });
  return { userId: user.id, role: user.role, code };
}

/** (Re)issues the signed-in applicant's access code. The previous code stops working immediately. */
export async function issueAccessCode(actor: Actor): Promise<string> {
  if (!isApplicantRole(actor.role)) throw new ForbiddenError("Access codes are available to applicant accounts only.");
  const code = generateAccessCode();
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: actor.id }, data: { accessCodeHash: hashAccessCode(normalizeAccessCode(code)!), accessCodeCreatedAt: new Date() } });
    await recordAudit({ actor, action: "access_code.issued", entityType: "User", entityId: actor.id, summary: "Access code issued (previous code revoked)" }, tx);
  });
  return code;
}

export async function revokeAccessCode(actor: Actor): Promise<void> {
  const [u, keys] = await Promise.all([db.user.findUnique({ where: { id: actor.id }, select: { isQuickAccount: true } }), db.passkey.count({ where: { userId: actor.id } })]);
  if (u?.isQuickAccount && keys === 0) throw new ValidationError("Add a passkey before removing your access code — otherwise you could not sign in.");
  await db.user.update({ where: { id: actor.id }, data: { accessCodeHash: null, accessCodeCreatedAt: null } });
  await recordAudit({ actor, action: "access_code.revoked", entityType: "User", entityId: actor.id, summary: "Access code removed" });
}

/** Rate-limited sign-in by access code. Applicant roles only; staff always use a password or passkey. */
export async function authenticateWithAccessCode(codeInput: string, clientKey: string): Promise<{ userId: string; role: string }> {
  const key = `code|${clientKey}`;
  const gate = loginAllowed(key);
  if (!gate.allowed) throw new ValidationError(`Too many failed attempts. Try again in ${Math.ceil(gate.retryAfterSec / 60)} minute(s).`);
  const fail = () => { recordLoginFailure(key); return new ValidationError("That access code was not recognised. Check it and try again."); };
  const normalized = normalizeAccessCode(codeInput);
  if (!normalized) throw fail();
  const user = await db.user.findUnique({ where: { accessCodeHash: hashAccessCode(normalized) }, select: { id: true, role: true, isActive: true } });
  if (!user || !user.isActive || !isApplicantRole(user.role)) throw fail();
  clearLoginFailures(key);
  return { userId: user.id, role: user.role };
}
