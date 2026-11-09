import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addSupportNote, createSupportRequest, getSupportStaff, listOwnSupport, listSupportStaff, updateSupportStatus } from "@/lib/services/support";
import { markAllRead, markRead, listNotifications, unreadCount } from "@/lib/services/notifications";
import { listAudit } from "@/lib/services/audit";
import { changeStaffRole, createStaffUser, listUsers, setUserActive } from "@/lib/services/users";
import { ForbiddenError } from "@/lib/permissions";
import { makeApplicant, makeStaff, uid } from "../helpers";

const contact = (over: Record<string, unknown> = {}) => ({
  name: "Casey Contact", email: `casey-${uid()}@example.test`, topic: "My application", message: "I have a question about my application.", consent: true, ...over,
});

describe("support", () => {
  it("validates the public contact form on the server and stores the request", async () => {
    await expect(createSupportRequest(contact({ consent: false }), null)).rejects.toThrow();
    await expect(createSupportRequest(contact({ email: "not-an-email" }), null)).rejects.toThrow();
    await expect(createSupportRequest(contact({ message: "short" }), null)).rejects.toThrow();
    await expect(createSupportRequest(contact({ topic: "Free money" }), null)).rejects.toThrow();
    await expect(createSupportRequest(contact({ relatedRef: "DROP TABLE" }), null)).rejects.toThrow();
    await expect(createSupportRequest(contact({ website: "http://spam.example" }), null)).rejects.toThrow(/could not be sent/);
    const req = await createSupportRequest(contact({ relatedRef: "nen-demo-2026-abc234" }), null);
    expect(req.reference).toMatch(/^NEN-SUP-\d{4}-/);
    expect(req.relatedRef).toBe("NEN-DEMO-2026-ABC234");
    expect(req.status).toBe("OPEN");
  });

  it("staff-only management; internal notes stay hidden from the requester; public replies are visible", async () => {
    const admin = await makeStaff("ADMIN");
    const reviewer = await makeStaff("REVIEWER");
    const user = await makeApplicant();
    const req = await createSupportRequest(contact(), user.id);
    await expect(listSupportStaff(reviewer)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listSupportStaff(user)).rejects.toBeInstanceOf(ForbiddenError);
    await addSupportNote(admin, req.id, { body: "INTERNAL: looks like a duplicate", isInternal: true });
    await addSupportNote(admin, req.id, { body: "Thanks — we are looking into it.", isInternal: false });
    const own = await listOwnSupport(user.id);
    const dump = JSON.stringify(own);
    expect(dump).toContain("looking into it");
    expect(dump).not.toContain("INTERNAL");
    expect((await getSupportStaff(admin, req.id)).req.notes).toHaveLength(2);
    await updateSupportStatus(admin, req.id, { status: "RESOLVED", assignedToId: reviewer.id });
    expect((await db.supportRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("RESOLVED");
    expect(await db.notification.count({ where: { userId: user.id, type: "SUPPORT_STATUS" } })).toBe(1);
    expect((await listSupportStaff(admin, { status: "RESOLVED", q: req.reference })).rows).toHaveLength(1);
    expect(await listOwnSupport((await makeApplicant()).id)).toHaveLength(0);
  });
});

describe("notifications", () => {
  it("counts unread, marks read, and only affects the owner's rows", async () => {
    const a = await makeApplicant();
    const b = await makeApplicant();
    const before = await unreadCount(a.id);
    expect(before).toBeGreaterThan(0); // welcome message
    const [first] = await listNotifications(a.id);
    await markRead(b.id, first.id); // someone else tries
    expect(await unreadCount(a.id)).toBe(before);
    await markRead(a.id, first.id);
    expect(await unreadCount(a.id)).toBe(before - 1);
    await markAllRead(a.id);
    expect(await unreadCount(a.id)).toBe(0);
    expect(await unreadCount(b.id)).toBeGreaterThan(0);
  });
});

describe("user & role administration", () => {
  it("admins manage staff; every change is audited; sessions are revoked on role change", async () => {
    const admin = await makeStaff("ADMIN");
    const staff = await createStaffUser(admin, { name: "New Reviewer", email: `rev-${uid()}@example.test`, role: "REVIEWER", password: "Another-Passw0rd1" });
    expect(staff.role).toBe("REVIEWER");
    expect(staff.passwordHash).not.toContain("Another");
    const { createSession, validateSessionToken } = await import("@/lib/auth/session-store");
    const { token } = await createSession(staff.id);
    await changeStaffRole(admin, staff.id, "ADMIN");
    expect(await validateSessionToken(token)).toBeNull();
    expect((await db.user.findUniqueOrThrow({ where: { id: staff.id } })).role).toBe("ADMIN");
    await setUserActive(admin, staff.id, false);
    expect((await db.user.findUniqueOrThrow({ where: { id: staff.id } })).isActive).toBe(false);
    const audit = await listAudit({ entityType: "User", q: staff.id });
    expect(audit.rows.map((r) => r.action)).toEqual(expect.arrayContaining(["user.staff_created", "user.role_changed", "user.deactivated"]));
  });

  it("blocks role escalation and self-lockout", async () => {
    const admin = await makeStaff("ADMIN");
    const reviewer = await makeStaff("REVIEWER");
    const applicant = await makeApplicant();
    await expect(createStaffUser(reviewer, { name: "X Y", email: `x-${uid()}@example.test`, role: "ADMIN", password: "Another-Passw0rd1" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(changeStaffRole(reviewer, reviewer.id, "ADMIN")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(changeStaffRole(applicant, applicant.id, "ADMIN")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(changeStaffRole(admin, applicant.id, "ADMIN")).rejects.toThrow(/Applicant accounts/);
    await expect(changeStaffRole(admin, admin.id, "REVIEWER")).rejects.toThrow(/own role/);
    await expect(setUserActive(admin, admin.id, false)).rejects.toThrow(/own account/);
    await expect(createStaffUser(admin, { name: "X Y", email: `x-${uid()}@example.test`, role: "SUPERUSER", password: "Another-Passw0rd1" })).rejects.toThrow();
    await expect(listUsers(reviewer)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
