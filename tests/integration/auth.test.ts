import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { authenticate, registerUser } from "@/lib/services/users";
import { createSession, destroySession, validateSessionToken, hashToken } from "@/lib/auth/session-store";
import { resetRateLimits } from "@/lib/rate-limit";
import { uid } from "../helpers";

const reg = (over: Record<string, unknown> = {}) => ({
  name: "Ada Tester", email: `ada-${uid()}@example.test`, password: "Test-Passw0rd1", confirmPassword: "Test-Passw0rd1",
  accountType: "INDIVIDUAL_APPLICANT", consentPrivacy: true, ...over,
});

describe("registration & authentication", () => {
  beforeEach(() => resetRateLimits());

  it("registers an individual with a profile, consent record and welcome notification; hashes the password", async () => {
    const input = reg();
    const { userId } = await registerUser(input);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { individual: true, consents: true, notifications: true } });
    expect(user.passwordHash).not.toContain("Passw0rd");
    expect(user.passwordHash.startsWith("$2")).toBe(true);
    expect(user.role).toBe("INDIVIDUAL_APPLICANT");
    expect(user.individual).not.toBeNull();
    expect(user.consents).toHaveLength(1);
    expect(user.notifications.length).toBeGreaterThan(0);
  });

  it("registers an organization with an explicit OWNER membership", async () => {
    const { userId } = await registerUser(reg({ accountType: "ORGANIZATION_APPLICANT", organizationName: "Fictional Co-op", organizationType: "COMMUNITY_ORG" }));
    const m = await db.organizationMembership.findMany({ where: { userId }, include: { organization: true } });
    expect(m).toHaveLength(1);
    expect(m[0].role).toBe("OWNER");
    expect(m[0].organization.name).toBe("Fictional Co-op");
  });

  it("refuses to self-register as staff (role escalation)", async () => {
    await expect(registerUser(reg({ accountType: "ADMIN" }))).rejects.toThrow();
    await expect(registerUser(reg({ accountType: "REVIEWER" }))).rejects.toThrow();
  });

  it("rejects duplicate emails, weak passwords and mismatched confirmation", async () => {
    const input = reg();
    await registerUser(input);
    await expect(registerUser({ ...input })).rejects.toThrow(/already exists/);
    await expect(registerUser(reg({ password: "short", confirmPassword: "short" }))).rejects.toThrow();
    await expect(registerUser(reg({ confirmPassword: "Different-1234" }))).rejects.toThrow();
    await expect(registerUser(reg({ consentPrivacy: false }))).rejects.toThrow();
  });

  it("authenticates valid credentials and gives the same error for wrong password / unknown email", async () => {
    const input = reg();
    await registerUser(input);
    await expect(authenticate({ email: input.email, password: input.password }, "ip1")).resolves.toMatchObject({ role: "INDIVIDUAL_APPLICANT" });
    const wrongPw = await authenticate({ email: input.email, password: "Wrong-Passw0rd1" }, "ip1").catch((e) => e.message);
    const unknown = await authenticate({ email: "nobody@example.test", password: "Wrong-Passw0rd1" }, "ip1").catch((e) => e.message);
    expect(wrongPw).toBe("Incorrect email or password.");
    expect(unknown).toBe(wrongPw);
  });

  it("rate-limits repeated failures, then blocks even the right password", async () => {
    const input = reg();
    await registerUser(input);
    for (let i = 0; i < 6; i++) await authenticate({ email: input.email, password: "Nope-Passw0rd1" }, "ip2").catch(() => undefined);
    await expect(authenticate({ email: input.email, password: input.password }, "ip2")).rejects.toThrow(/Too many failed attempts/);
    await expect(authenticate({ email: input.email, password: input.password }, "other-ip")).resolves.toBeTruthy();
  });

  it("deactivated accounts cannot sign in or keep sessions", async () => {
    const input = reg();
    const { userId } = await registerUser(input);
    const { token } = await createSession(userId);
    expect(await validateSessionToken(token)).toMatchObject({ id: userId });
    await db.user.update({ where: { id: userId }, data: { isActive: false } });
    expect(await validateSessionToken(token)).toBeNull();
    await expect(authenticate({ email: input.email, password: input.password }, "ip3")).rejects.toThrow();
  });

  it("stores only a hash of the session token; logout and expiry invalidate it", async () => {
    const { userId } = await registerUser(reg());
    const { token } = await createSession(userId);
    expect(await db.session.findFirst({ where: { tokenHash: token } })).toBeNull();
    expect(await db.session.findFirst({ where: { tokenHash: hashToken(token) } })).not.toBeNull();
    await destroySession(token);
    expect(await validateSessionToken(token)).toBeNull();
    const { token: t2 } = await createSession(userId);
    await db.session.updateMany({ where: { tokenHash: hashToken(t2) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await validateSessionToken(t2)).toBeNull();
    expect(await validateSessionToken("garbage")).toBeNull();
    expect(await validateSessionToken(undefined)).toBeNull();
  });
});
