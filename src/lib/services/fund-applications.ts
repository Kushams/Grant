import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { ORG } from "@/config/organization";
import { assertCan, NotFoundError, ValidationError, type Actor } from "../permissions";
import { fundApplicationNoteSchema, fundApplicationSchema, fundApplicationStatusSchema } from "../validation/fund-application";
import { buildReference, withUniqueReference } from "../references";
import { recordSubmission, submissionAllowed } from "../rate-limit";
import { recordAudit } from "./audit";
import { notifyAdmins } from "./notifications";

/**
 * Public (no-account) General Opportunity Fund applications.
 *
 * Guardrails (HANDOFF.md §0, §5): only the approved short fields are stored; staff
 * see submissions in /admin and may only contact applicants about the outcome using
 * the details the applicant supplied. Nothing here charges a fee, moves money, or
 * sends external email/SMS.
 */
const RATE_KEY_PREFIX = "fund-application:";
const RATE_MAX = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function createFundApplication(raw: unknown) {
  const input = fundApplicationSchema.parse(raw);
  if (input.website) throw new ValidationError("Your application could not be submitted."); // honeypot tripped
  const rateKey = RATE_KEY_PREFIX + input.email;
  if (!submissionAllowed(rateKey, RATE_MAX, RATE_WINDOW_MS)) {
    throw new ValidationError("We have received several applications from this email address recently. Please wait a while before submitting another.");
  }
  const created = await db.$transaction(async (tx) => {
    const app = await withUniqueReference(
      () => buildReference("APP", false),
      (reference) =>
        tx.fundApplication.create({
          data: {
            reference,
            fullName: input.fullName,
            email: input.email,
            phone: input.phone ?? null,
            country: input.country,
            applicantType: input.applicantType,
            story: input.story ?? null,
            purpose: input.purpose,
            useOfFunds: input.useOfFunds,
            amountMinor: input.amountRequested,
            budgetSummary: input.budgetSummary,
            hasConflict: input.hasConflict,
            conflictDetails: input.hasConflict ? (input.conflictDetails ?? null) : null,
            consentAt: new Date(),
          },
        }),
    );
    await tx.consentRecord.create({ data: { userId: null, subject: "FUND_APPLICATION", fundApplicationId: app.id, documentVersion: ORG.policyVersion } });
    await notifyAdmins({ type: "STAFF_FUND_APPLICATION", title: "New fund application", body: `${app.reference}: ${app.fullName} (${app.country})`, href: `/admin/fund-applications/${app.id}` }, tx);
    return app;
  });
  recordSubmission(rateKey);
  return created;
}

export type FundApplicationListParams = { q?: string; status?: string; page?: number; pageSize?: number };

export async function listFundApplicationsStaff(actor: Actor, p: FundApplicationListParams = {}) {
  assertCan(actor.role, "support:manage");
  const pageSize = p.pageSize ?? 20;
  const page = Math.max(p.page ?? 1, 1);
  const where: Prisma.FundApplicationWhereInput = {
    ...(p.status ? { status: p.status } : {}),
    ...(p.q ? { OR: [{ reference: { contains: p.q } }, { fullName: { contains: p.q } }, { email: { contains: p.q } }, { country: { contains: p.q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.fundApplication.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.fundApplication.count({ where }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFundApplicationStaff(actor: Actor, id: string) {
  assertCan(actor.role, "support:manage");
  const app = await db.fundApplication.findUnique({ where: { id }, include: { notes: { orderBy: { createdAt: "asc" } } } });
  if (!app) throw new NotFoundError("Fund application not found.");
  const authors = await db.user.findMany({ where: { id: { in: app.notes.map((n) => n.authorId) } }, select: { id: true, name: true } });
  return { app, authors: Object.fromEntries(authors.map((a) => [a.id, a.name])) };
}

export async function updateFundApplicationStatus(actor: Actor, id: string, raw: unknown) {
  assertCan(actor.role, "support:manage");
  const input = fundApplicationStatusSchema.parse(raw);
  const app = await db.fundApplication.findUnique({ where: { id } });
  if (!app) throw new NotFoundError("Fund application not found.");
  await db.$transaction(async (tx) => {
    await tx.fundApplication.update({ where: { id }, data: { status: input.status } });
    if (app.status !== input.status) {
      await recordAudit({ actor, action: "fundApplication.updated", entityType: "FundApplication", entityId: id, summary: `${app.reference}: ${app.status} → ${input.status}`, before: { status: app.status }, after: { status: input.status } }, tx);
    }
  });
}

/** Staff notes are internal only — applicants have no account, so nothing here is ever shown to them. */
export async function addFundApplicationNote(actor: Actor, id: string, raw: unknown) {
  assertCan(actor.role, "support:manage");
  const input = fundApplicationNoteSchema.parse(raw);
  const app = await db.fundApplication.findUnique({ where: { id } });
  if (!app) throw new NotFoundError("Fund application not found.");
  await db.fundApplicationNote.create({ data: { fundApplicationId: id, authorId: actor.id, body: input.body } });
}
