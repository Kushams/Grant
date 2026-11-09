import { createHash, randomBytes } from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransport,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { db } from "../db";
import { ValidationError, type Actor } from "../permissions";
import type { RelyingParty } from "../auth/webauthn-config";
import { recordAudit } from "./audit";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const b64u = (b: Uint8Array) => Buffer.from(b).toString("base64url");
const fromB64u = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));

async function saveChallenge(challenge: string, kind: "REGISTER" | "LOGIN", userId?: string) {
  const token = randomBytes(24).toString("base64url");
  await db.webAuthnChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } }); // opportunistic cleanup
  await db.webAuthnChallenge.create({ data: { tokenHash: hash(token), challenge, kind, userId: userId ?? null, expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) } });
  return token;
}

/** Single use: the row is deleted whether or not verification later succeeds. */
async function takeChallenge(token: string, kind: "REGISTER" | "LOGIN", userId?: string) {
  const row = await db.webAuthnChallenge.findUnique({ where: { tokenHash: hash(token) } });
  if (!row) throw new ValidationError("That request expired. Please try again.");
  await db.webAuthnChallenge.delete({ where: { id: row.id } }).catch(() => undefined);
  if (row.kind !== kind || row.expiresAt.getTime() < Date.now() || (userId && row.userId !== userId)) throw new ValidationError("That request expired. Please try again.");
  return row.challenge;
}

// ---------------------------------------------------------------- registration (signed-in user adds a passkey)
export async function beginPasskeyRegistration(actor: Actor, rp: RelyingParty) {
  const [user, existing] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: actor.id }, select: { id: true, name: true, email: true } }),
    db.passkey.findMany({ where: { userId: actor.id }, select: { credentialId: true, transports: true } }),
  ]);
  const options = await generateRegistrationOptions({
    rpName: rp.rpName, rpID: rp.rpID, userName: user.email.endsWith("@accounts.invalid") ? user.name : user.email, userDisplayName: user.name,
    userID: new TextEncoder().encode(user.id), attestationType: "none",
    excludeCredentials: existing.map((c) => ({ id: c.credentialId, transports: c.transports ? (JSON.parse(c.transports) as AuthenticatorTransport[]) : undefined })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" }, // discoverable: no username needed to sign in
  });
  return { options, token: await saveChallenge(options.challenge, "REGISTER", actor.id) };
}

export async function finishPasskeyRegistration(actor: Actor, rp: RelyingParty, token: string, response: RegistrationResponseJSON, label?: string) {
  const expectedChallenge = await takeChallenge(token, "REGISTER", actor.id);
  const v = await verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: true }).catch(() => null);
  if (!v?.verified || !v.registrationInfo) throw new ValidationError("We could not verify that passkey. Please try again.");
  const { credential } = v.registrationInfo;
  if (await db.passkey.findUnique({ where: { credentialId: credential.id } })) throw new ValidationError("That passkey is already registered.");
  await db.$transaction(async (tx) => {
    await tx.passkey.create({ data: { userId: actor.id, credentialId: credential.id, publicKey: b64u(credential.publicKey), counter: credential.counter, transports: credential.transports ? JSON.stringify(credential.transports) : null, label: (label ?? "").trim().slice(0, 60) || "This device" } });
    await recordAudit({ actor, action: "passkey.added", entityType: "User", entityId: actor.id, summary: "Passkey added" }, tx);
  });
}

// ---------------------------------------------------------------- sign-in (no account hint needed)
export async function beginPasskeyLogin(rp: RelyingParty) {
  const options = await generateAuthenticationOptions({ rpID: rp.rpID, userVerification: "required" });
  return { options, token: await saveChallenge(options.challenge, "LOGIN") };
}

export async function finishPasskeyLogin(rp: RelyingParty, token: string, response: AuthenticationResponseJSON): Promise<{ userId: string; role: string }> {
  const expectedChallenge = await takeChallenge(token, "LOGIN");
  const fail = () => new ValidationError("That passkey was not recognised.");
  const cred = await db.passkey.findUnique({ where: { credentialId: response.id }, include: { user: { select: { id: true, role: true, isActive: true } } } });
  if (!cred || !cred.user.isActive) throw fail();
  const v = await verifyAuthenticationResponse({
    response, expectedChallenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: true,
    credential: { id: cred.credentialId, publicKey: fromB64u(cred.publicKey), counter: cred.counter, transports: cred.transports ? (JSON.parse(cred.transports) as AuthenticatorTransport[]) : undefined },
  }).catch(() => null);
  if (!v?.verified) throw fail();
  await db.passkey.update({ where: { id: cred.id }, data: { counter: v.authenticationInfo.newCounter, lastUsedAt: new Date() } });
  return { userId: cred.user.id, role: cred.user.role };
}

// ---------------------------------------------------------------- management
export const listPasskeys = (userId: string) =>
  db.passkey.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true, label: true, createdAt: true, lastUsedAt: true } });

export async function removePasskey(actor: Actor, id: string) {
  const [target, total, user] = await Promise.all([
    db.passkey.findFirst({ where: { id, userId: actor.id } }),
    db.passkey.count({ where: { userId: actor.id } }),
    db.user.findUnique({ where: { id: actor.id }, select: { isQuickAccount: true, accessCodeHash: true } }),
  ]);
  if (!target) throw new ValidationError("Passkey not found.");
  if (user?.isQuickAccount && total <= 1 && !user.accessCodeHash) throw new ValidationError("This is your only way to sign in. Create an access code first.");
  await db.passkey.delete({ where: { id } });
  await recordAudit({ actor, action: "passkey.removed", entityType: "User", entityId: actor.id, summary: "Passkey removed" });
}
