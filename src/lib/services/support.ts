import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { ORG } from "@/config/organization";
import { assertCan, NotFoundError, ValidationError, type Actor } from "../permissions";
import { contactSchema, supportNoteSchema, supportStatusSchema } from "../validation/support";
import { buildReference, withUniqueReference } from "../references";
import { recordAudit } from "./audit";
import { notify, notifyAdmins } from "./notifications";

/** Public contact form. `userId` is attached only when the request comes from a signed-in session. */
export async function createSupportRequest(raw: unknown, userId: string | null) {
  const input = contactSchema.parse(raw);
  if (input.website) throw new ValidationError("Your message could not be sent."); // honeypot tripped
  return db.$transaction(async (tx) => {
    const req = await withUniqueReference(
      () => buildReference("SUP", false),
      (reference) =>
        tx.supportRequest.create({
          data: { reference, userId, name: input.name, email: input.email, topic: input.topic, relatedRef: input.relatedRef ?? null, message: input.message, consentAt: new Date() },
        }),
    );
    await tx.consentRecord.create({ data: { userId, subject: "SUPPORT_REQUEST", supportRequestId: req.id, documentVersion: ORG.policyVersion } });
    await notifyAdmins({ type: "STAFF_SUPPORT", title: "New support request", body: `${req.reference}: ${req.topic}`, href: `/admin/support/${req.id}` }, tx);
    if (userId) await notify({ userId, type: "SUPPORT_RECEIVED", title: "Support request received", body: `Your request ${req.reference} was stored in our in-app support queue. No email has been sent.`, href: "/dashboard/support" }, tx);
    return req;
  });
}

export type SupportListParams = { q?: string; status?: string; page?: number; pageSize?: number };

export async function listSupportStaff(actor: Actor, p: SupportListParams = {}) {
  assertCan(actor.role, "support:manage");
  const pageSize = p.pageSize ?? 20;
  const page = Math.max(p.page ?? 1, 1);
  const where: Prisma.SupportRequestWhereInput = {
    ...(p.status ? { status: p.status } : {}),
    ...(p.q ? { OR: [{ reference: { contains: p.q } }, { name: { contains: p.q } }, { topic: { contains: p.q } }, { relatedRef: { contains: p.q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.supportRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.supportRequest.count({ where }),
  ]);
  const assignees = await db.user.findMany({ where: { id: { in: rows.map((r) => r.assignedToId).filter((x): x is string => !!x) } }, select: { id: true, name: true } });
  return { rows: rows.map((r) => ({ ...r, assignedName: assignees.find((a) => a.id === r.assignedToId)?.name ?? null })), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getSupportStaff(actor: Actor, id: string) {
  assertCan(actor.role, "support:manage");
  const req = await db.supportRequest.findUnique({ where: { id }, include: { notes: { orderBy: { createdAt: "asc" } } } });
  if (!req) throw new NotFoundError("Support request not found.");
  const authors = await db.user.findMany({ where: { id: { in: [...req.notes.map((n) => n.authorId), ...(req.assignedToId ? [req.assignedToId] : [])] } }, select: { id: true, name: true } });
  return { req, authors: Object.fromEntries(authors.map((a) => [a.id, a.name])) };
}

export async function updateSupportStatus(actor: Actor, id: string, raw: unknown) {
  assertCan(actor.role, "support:manage");
  const input = supportStatusSchema.parse(raw);
  const req = await db.supportRequest.findUnique({ where: { id } });
  if (!req) throw new NotFoundError("Support request not found.");
  if (input.assignedToId) {
    const staff = await db.user.findFirst({ where: { id: input.assignedToId, role: { in: ["ADMIN", "REVIEWER"] }, isActive: true } });
    if (!staff) throw new ValidationError("Choose an active staff member.");
  }
  await db.$transaction(async (tx) => {
    await tx.supportRequest.update({ where: { id }, data: { status: input.status, assignedToId: input.assignedToId ?? null } });
    if (req.status !== input.status || req.assignedToId !== (input.assignedToId ?? null)) {
      await recordAudit({ actor, action: "support.updated", entityType: "SupportRequest", entityId: id, summary: `${req.reference}: ${req.status} → ${input.status}`, before: { status: req.status, assignedToId: req.assignedToId }, after: { status: input.status, assignedToId: input.assignedToId ?? null } }, tx);
    }
    if (req.userId && req.status !== input.status) {
      await notify({ userId: req.userId, type: "SUPPORT_STATUS", title: "Support request updated", body: `Your request ${req.reference} is now "${input.status.replace("_", " ").toLowerCase()}".`, href: "/dashboard/support" }, tx);
    }
  });
}

export async function addSupportNote(actor: Actor, id: string, raw: unknown) {
  assertCan(actor.role, "support:manage");
  const input = supportNoteSchema.parse(raw);
  const req = await db.supportRequest.findUnique({ where: { id } });
  if (!req) throw new NotFoundError("Support request not found.");
  await db.$transaction(async (tx) => {
    await tx.supportNote.create({ data: { supportRequestId: id, authorId: actor.id, body: input.body, isInternal: input.isInternal } });
    if (!input.isInternal && req.userId) {
      await notify({ userId: req.userId, type: "SUPPORT_REPLY", title: "Reply to your support request", body: `Staff replied to ${req.reference}. Open your support page to read it.`, href: "/dashboard/support" }, tx);
    }
  });
}

/** Applicant view: own requests + PUBLIC replies only (internal notes are never selected). */
export async function listOwnSupport(userId: string) {
  return db.supportRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, reference: true, topic: true, message: true, status: true, createdAt: true, relatedRef: true, notes: { where: { isInternal: false }, orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true } } },
  });
}
