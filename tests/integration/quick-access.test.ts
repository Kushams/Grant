import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { authenticateWithAccessCode, createQuickAccount, issueAccessCode, revokeAccessCode } from "@/lib/services/quick-access";
import { beginPasskeyLogin, beginPasskeyRegistration, finishPasskeyLogin, listPasskeys, removePasskey } from "@/lib/services/passkeys";
import { hashAccessCode, isPlaceholderEmail } from "@/lib/auth/access-code";
import { resetRateLimits } from "@/lib/rate-limit";
import { makeApplicant, makeStaff } from "../helpers";
import type { Actor } from "@/lib/permissions";

const rp = { rpID: "localhost", origin: "http://localhost:3100", rpName: "NEN" };
const quick = async () => {
  const r = await createQuickAccount({ name: "Quinn Quick", consentPrivacy: true });
  return { ...r, actor: { id: r.userId, role: r.role, name: "Quinn Quick" } as Actor };
};

describe("quick accounts and access codes", () => {
  beforeEach(() => resetRateLimits());

  it("creates a no-email applicant with profile, consent, a stored HASH of the code, and a one-time code", async () => {
    const { userId, code } = await quick();
    const u = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { individual: true, consents: true } });
    expect(u.isQuickAccount).toBe(true);
    expect(isPlaceholderEmail(u.email)).toBe(true);
    expect(u.role).toBe("INDIVIDUAL_APPLICANT");
    expect(u.individual).not.toBeNull();
    expect(u.consents).toHaveLength(1);
    expect(u.accessCodeHash).toHaveLength(64);
    expect(JSON.stringify(u)).not.toContain(code.replace(/NEN-|-/g, ""));
  });

  it("requires privacy consent and a name", async () => {
    await expect(createQuickAccount({ name: "Q", consentPrivacy: true })).rejects.toThrow();
    await expect(createQuickAccount({ name: "Quinn Quick", consentPrivacy: false })).rejects.toThrow();
  });

  it("signs in with the code in any case/format, and rejects wrong codes generically", async () => {
    const { userId, code } = await quick();
    expect((await authenticateWithAccessCode(code.toLowerCase().replace(/-/g, " "), "ip1")).userId).toBe(userId);
    await expect(authenticateWithAccessCode("NEN-AAAA-BBBB-CCCC-DDDD", "ip2")).rejects.toThrow(/not recognised/);
    await expect(authenticateWithAccessCode("nonsense", "ip3")).rejects.toThrow(/not recognised/);
  });

  it("rate-limits repeated bad codes per client, then recovers for other clients", async () => {
    for (let i = 0; i < 6; i++) await expect(authenticateWithAccessCode("NEN-AAAA-BBBB-CCCC-DDDD", "ipX")).rejects.toThrow(/not recognised/);
    await expect(authenticateWithAccessCode("NEN-AAAA-BBBB-CCCC-DDDD", "ipX")).rejects.toThrow(/Too many/);
    const { code, userId } = await quick();
    expect((await authenticateWithAccessCode(code, "ipY")).userId).toBe(userId);
  });

  it("regenerating invalidates the old code immediately", async () => {
    const { code: oldCode, actor } = await quick();
    const fresh = await issueAccessCode(actor);
    expect(fresh).not.toBe(oldCode);
    await expect(authenticateWithAccessCode(oldCode, "ipA")).rejects.toThrow(/not recognised/);
    await expect(authenticateWithAccessCode(fresh, "ipA")).resolves.toBeTruthy();
  });

  it("refuses sign-in for deactivated users", async () => {
    const { userId, code } = await quick();
    await db.user.update({ where: { id: userId }, data: { isActive: false } });
    await expect(authenticateWithAccessCode(code, "ipB")).rejects.toThrow(/not recognised/);
  });

  it("never issues or accepts access codes for staff accounts", async () => {
    const admin = await makeStaff("ADMIN");
    await expect(issueAccessCode(admin)).rejects.toThrow();
    await db.user.update({ where: { id: admin.id }, data: { accessCodeHash: hashAccessCode("ABCDEFGHJKMNPQRS") } });
    await expect(authenticateWithAccessCode("ABCDEFGHJKMNPQRS", "ipC")).rejects.toThrow(/not recognised/);
  });

  it("lets an ordinary email account add an access code too", async () => {
    const a = await makeApplicant();
    const code = await issueAccessCode(a);
    expect((await authenticateWithAccessCode(code, "ipD")).userId).toBe(a.id);
  });

  it("will not remove the only way to sign in on a quick account", async () => {
    const { actor } = await quick();
    await expect(revokeAccessCode(actor)).rejects.toThrow(/passkey/i);
  });
});

describe("passkey challenges", () => {
  it("registration needs a signed-in user and returns discoverable-credential options with a single-use token", async () => {
    const { actor } = await quick();
    const { options, token } = await beginPasskeyRegistration(actor, rp);
    expect(options.rp.id).toBe("localhost");
    expect(options.authenticatorSelection?.residentKey).toBe("required");
    expect(options.authenticatorSelection?.userVerification).toBe("required");
    expect(token.length).toBeGreaterThan(20);
    const row = await db.webAuthnChallenge.findFirstOrThrow({ where: { userId: actor.id } });
    expect(row.challenge).toBe(options.challenge);
    expect(row.tokenHash).not.toBe(token); // only a hash is stored
  });

  it("login challenges are consumed even when verification fails, and unknown credentials fail generically", async () => {
    const { token } = await beginPasskeyLogin(rp);
    const bogus = { id: "does-not-exist", rawId: "does-not-exist", type: "public-key", clientExtensionResults: {}, response: { clientDataJSON: "", authenticatorData: "", signature: "" } } as never;
    await expect(finishPasskeyLogin(rp, token, bogus)).rejects.toThrow(/not recognised/);
    await expect(finishPasskeyLogin(rp, token, bogus)).rejects.toThrow(/expired/); // token already used
  });

  it("rejects an expired challenge", async () => {
    const { token } = await beginPasskeyLogin(rp);
    await db.webAuthnChallenge.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(finishPasskeyLogin(rp, token, { id: "x" } as never)).rejects.toThrow(/expired/);
  });

  it("lists and removes only the owner's passkeys; protects the last sign-in method", async () => {
    const { actor } = await quick();
    const other = await quick();
    const mk = (userId: string, n: string) => db.passkey.create({ data: { userId, credentialId: `cred-${n}-${Math.random()}`, publicKey: "AA", counter: 0, label: n } });
    const mine = await mk(actor.id, "mine");
    const theirs = await mk(other.actor.id, "theirs");
    expect(await listPasskeys(actor.id)).toHaveLength(1);
    await expect(removePasskey(actor, theirs.id)).rejects.toThrow(/not found/i); // cannot touch someone else's key
    await revokeAccessCode(actor); // allowed: this quick account now has a passkey
    await expect(removePasskey(actor, mine.id)).rejects.toThrow(/only way/i); // would lock the account out
  });
});
