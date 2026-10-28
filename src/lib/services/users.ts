import { db } from "../db";
import { hashPassword, verifyPassword, DUMMY_HASH } from "../auth/password";
import { clearLoginFailures, loginAllowed, recordLoginFailure } from "../rate-limit";
import { ForbiddenError, NotFoundError, ValidationError, type Actor } from "../permissions";
import { loginSchema, registerSchema, staffUserSchema } from "../validation/auth";
import {
  individualProfileSchema,
  organizationProfileSchema,
  type IndividualProfileInput,
  type OrganizationProfileInput,
} from "../validation/profile";
import { ORG } from "@/config/organization";
import { recordAudit } from "./audit";
import { notify } from "./notifications";
import { toJson } from "../json";
import { destroyAllSessionsForUser } from "../auth/session-store";

export async function registerUser(raw: unknown): Promise<{ userId: string; role: string }> {
  const input = registerSchema.parse(raw);
  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new ValidationError("An account with this email already exists. Try signing in instead.", { email: ["This email is already registered."] });
  const passwordHash = await hashPassword(input.password);

  const user = await db.$transaction(async (tx) => {
    const u = await tx.user.create({ data: { email: input.email, name: input.name, passwordHash, role: input.accountType } });
    if (input.accountType === "INDIVIDUAL_APPLICANT") {
      await tx.individualProfile.create({ data: { userId: u.id, fullName: input.name, interests: "[]" } });
    } else {
      const org = await tx.organizationProfile.create({
        data: { name: input.organizationName!, type: input.organizationType!, sectors: "[]" },
      });
      await tx.organizationMembership.create({ data: { organizationId: org.id, userId: u.id, role: "OWNER" } });
    }
    await tx.consentRecord.create({ data: { userId: u.id, subject: "REGISTRATION", documentVersion: ORG.policyVersion } });
    await recordAudit({ actor: { id: u.id, role: u.role as Actor["role"], name: u.name }, action: "user.registered", entityType: "User", entityId: u.id, summary: `Account registered (${u.role})` }, tx);
    await notify({ userId: u.id, type: "WELCOME", title: "Welcome to National Empowerment Network", body: "Complete your profile, then browse opportunities. Applying never guarantees funding.", href: "/dashboard/profile" }, tx);
    return u;
  });
  return { userId: user.id, role: user.role };
}

/** Verifies credentials with rate limiting and constant-ish timing. Returns the user id. */
export async function authenticate(raw: unknown, clientKey: string): Promise<{ userId: string; role: string; next?: string }> {
  const input = loginSchema.parse(raw);
  const key = `${input.email}|${clientKey}`;
  const gate = loginAllowed(key);
  if (!gate.allowed) {
    throw new ValidationError(`Too many failed attempts. Try again in ${Math.ceil(gate.retryAfterSec / 60)} minute(s).`);
  }
  const user = await db.user.findUnique({ where: { email: input.email } });
  const ok = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.isActive) {
    recordLoginFailure(key);
    throw new ValidationError("Incorrect email or password.");
  }
  clearLoginFailures(key);
  return { userId: user.id, role: user.role, next: input.next };
}

// ---------------------------------------------------------------- profiles
export async function getIndividualProfile(userId: string) {
  return db.individualProfile.findUnique({ where: { userId } });
}

export async function updateIndividualProfile(userId: string, raw: unknown): Promise<IndividualProfileInput> {
  const input = individualProfileSchema.parse(raw);
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "INDIVIDUAL_APPLICANT") throw new ForbiddenError("Only individual accounts have an individual profile.");
  await db.individualProfile.update({
    where: { userId },
    data: { ...input, city: input.city ?? null, phone: input.phone ?? null, background: input.background ?? null, interests: toJson(input.interests) },
  });
  await db.user.update({ where: { id: userId }, data: { name: input.fullName } });
  return input;
}

export async function listOrganizationsForUser(userId: string) {
  const rows = await db.organizationMembership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((m) => ({ ...m.organization, membershipRole: m.role }));
}

/** Access to an organization requires an explicit membership — never name matching. */
export async function assertOrganizationMember(userId: string, organizationId: string) {
  const m = await db.organizationMembership.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
  if (!m) throw new ForbiddenError("You do not have access to that organization.");
  return m;
}

export async function updateOrganizationProfile(userId: string, organizationId: string, raw: unknown): Promise<OrganizationProfileInput> {
  await assertOrganizationMember(userId, organizationId);
  const input = organizationProfileSchema.parse(raw);
  await db.organizationProfile.update({
    where: { id: organizationId },
    data: {
      name: input.name,
      type: input.type,
      country: input.country,
      city: input.city ?? null,
      contactEmail: input.contactEmail,
      phone: input.phone ?? null,
      website: input.website ?? null,
      description: input.description ?? null,
      sectors: toJson(input.sectors),
    },
  });
  return input;
}

// ---------------------------------------------------------------- admin: users
export async function listUsers(actor: Actor) {
  if (actor.role !== "ADMIN") throw new ForbiddenError();
  return db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, isDemo: true, createdAt: true },
  });
}

export async function listReviewers() {
  return db.user.findMany({
    where: { role: { in: ["REVIEWER", "ADMIN"] }, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
}

export async function createStaffUser(actor: Actor, raw: unknown) {
  if (actor.role !== "ADMIN") throw new ForbiddenError();
  const input = staffUserSchema.parse(raw);
  const dup = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (dup) throw new ValidationError("That email is already in use.", { email: ["This email is already registered."] });
  const passwordHash = await hashPassword(input.password);
  const u = await db.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { email: input.email, name: input.name, role: input.role, passwordHash } });
    await recordAudit({ actor, action: "user.staff_created", entityType: "User", entityId: created.id, summary: `Created ${input.role} account for ${input.email}`, after: { role: input.role, email: input.email } }, tx);
    return created;
  });
  return u;
}

export async function changeStaffRole(actor: Actor, userId: string, newRole: string) {
  if (actor.role !== "ADMIN") throw new ForbiddenError();
  if (newRole !== "REVIEWER" && newRole !== "ADMIN") throw new ValidationError("Roles can only be switched between Reviewer and Administrator.");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("User not found.");
  if (target.role !== "REVIEWER" && target.role !== "ADMIN") throw new ValidationError("Applicant accounts cannot be converted to staff roles.");
  if (target.id === actor.id) throw new ValidationError("You cannot change your own role.");
  if (target.role === newRole) return;
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { role: newRole } });
    await recordAudit({ actor, action: "user.role_changed", entityType: "User", entityId: userId, summary: `Role changed for ${target.email}`, before: { role: target.role }, after: { role: newRole } }, tx);
  });
  await destroyAllSessionsForUser(userId); // force re-authentication under the new role
}

export async function setUserActive(actor: Actor, userId: string, active: boolean) {
  if (actor.role !== "ADMIN") throw new ForbiddenError();
  if (userId === actor.id) throw new ValidationError("You cannot deactivate your own account.");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("User not found.");
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { isActive: active } });
    await recordAudit({ actor, action: active ? "user.activated" : "user.deactivated", entityType: "User", entityId: userId, summary: `${active ? "Activated" : "Deactivated"} ${target.email}`, before: { isActive: target.isActive }, after: { isActive: active } }, tx);
  });
  if (!active) await destroyAllSessionsForUser(userId);
}
