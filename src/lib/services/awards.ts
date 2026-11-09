/**
 * Awards & disbursements. IMPORTANT: this module RECORDS administrative decisions and manual
 * status entries. It never moves money, never contacts a payment provider, and nothing it
 * stores is independently verified. UI wording must keep that distinction.
 */
import type { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "../db";
import {
  DISBURSEMENT_LABELS,
  isApplicantRole,
  type ApplicationStatus,
  type DisbursementStatus,
} from "../constants";
import { assertCan, ForbiddenError, NotFoundError, ValidationError, type Actor } from "../permissions";
import { formatMinor, isCurrency, parseAmountToMinor, MAX_MINOR } from "../money";
import { buildReference, withUniqueReference } from "../references";
import {
  DISBURSEMENT_TRANSITIONS,
  LOCKED_FOR_EDIT,
  REQUIRES_MANUAL_ACK,
  impliedApplicationStatus,
  isCounting,
  summarizeAward,
  validateScheduleTotal,
} from "../awards-calc";
import {
  changeAwardAmountSchema,
  changeDisbursementStatusSchema,
  createAwardSchema,
  createDisbursementSchema,
  updateAwardSchema,
  updateDisbursementSchema,
} from "../validation/award";
import { applyTransition, memberOrganizationIds } from "./applications";
import { recordAudit } from "./audit";
import { notify } from "./notifications";

function minorOrThrow(text: string, currency: string, field = "amount"): number {
  const minor = parseAmountToMinor(text, currency);
  if (minor === null || minor <= 0 || minor > MAX_MINOR) {
    throw new ValidationError("Enter a positive amount with the correct number of decimals.", { [field]: ["Enter a positive amount with the correct number of decimals."] });
  }
  return minor;
}

// ---------------------------------------------------------------- application status sync
/** Keeps the application's post-approval status consistent with its award records. */
async function syncApplicationStatus(tx: Tx, awardId: string, actor: Actor | null) {
  const award = await tx.award.findUnique({ where: { id: awardId }, include: { disbursements: true, application: { select: { id: true, status: true } } } });
  if (!award) return;
  const current = award.application.status as ApplicationStatus;
  if (!["AWARD_PROCESSING", "DISBURSEMENT_SCHEDULED", "PARTIALLY_DISBURSED", "FULLY_DISBURSED"].includes(current)) return;
  const target = award.status === "CANCELLED" ? "AWARD_PROCESSING" : impliedApplicationStatus(award.amountMinor, award.disbursements);
  if (target === current) return;
  await applyTransition(tx, { appId: award.application.id, to: target, actor: null, internalNote: "Updated automatically from award/disbursement records.", notifyApplicant: false });
  void actor;
}

// ---------------------------------------------------------------- create award
export async function createAward(actor: Actor, raw: unknown) {
  assertCan(actor.role, "award:manage");
  const input = createAwardSchema.parse(raw);
  const app = await db.application.findUnique({
    where: { id: input.applicationId },
    include: { opportunity: true, award: true, decisions: { where: { kind: "FINAL" }, orderBy: { decidedAt: "desc" }, take: 1 } },
  });
  if (!app) throw new NotFoundError("Application not found.");
  if (app.award) throw new ValidationError("This application already has an award record.");
  const decision = app.decisions[0];
  if (app.status !== "APPROVED" || !decision || decision.outcome !== "APPROVE") {
    throw new ValidationError("An award can only be created for an application with a recorded final approval.");
  }
  if (!isCurrency(input.currency)) throw new ValidationError("Choose a supported currency.", { currency: ["Choose a supported currency."] });
  const amountMinor = minorOrThrow(input.amount, input.currency);
  const opp = app.opportunity;
  if (opp.fundingSpecified && opp.currency === input.currency) {
    if (opp.fixedAmountMinor != null && amountMinor !== opp.fixedAmountMinor) {
      throw new ValidationError(`This programme has a fixed award of ${formatMinor(opp.fixedAmountMinor, opp.currency)}.`, { amount: ["Does not match the programme's fixed amount."] });
    }
    if (opp.minAmountMinor != null && amountMinor < opp.minAmountMinor) throw new ValidationError("The amount is below the programme minimum.", { amount: ["Below the programme minimum."] });
    if (opp.maxAmountMinor != null && amountMinor > opp.maxAmountMinor) throw new ValidationError("The amount is above the programme maximum.", { amount: ["Above the programme maximum."] });
  }

  return db.$transaction(async (tx) => {
    const award = await withUniqueReference(
      () => buildReference("AWD", opp.classification === "DEMO"),
      (reference) =>
        tx.award.create({
          data: {
            reference,
            applicationId: app.id,
            decisionId: decision.id,
            amountMinor,
            currency: input.currency,
            approvedAt: decision.decidedAt,
            approvedById: decision.decidedById,
            acceptanceStatus: input.acceptanceStatus,
            conditions: input.conditions ?? null,
            applicantSummary: input.applicantSummary ?? null,
            internalNotes: input.internalNotes ?? null,
            createdById: actor.id,
          },
        }),
    );
    await applyTransition(tx, { appId: app.id, to: "AWARD_PROCESSING", actor, internalNote: `Award ${award.reference} created.`, notifyApplicant: false });
    await notify({ userId: app.applicantUserId, type: "AWARD_CREATED", title: "Award record created", body: `Staff recorded award ${award.reference} for ${app.reference}. This is an administrative record; no payment has been made by this site.`, href: `/dashboard/applications/${app.id}` }, tx);
    await recordAudit({ actor, action: "award.created", entityType: "Award", entityId: award.id, summary: `Award ${award.reference} created for ${app.reference}: ${formatMinor(amountMinor, input.currency)}`, after: { amountMinor, currency: input.currency, applicationId: app.id } }, tx);
    return award;
  });
}

export async function updateAward(actor: Actor, awardId: string, raw: unknown) {
  assertCan(actor.role, "award:manage");
  const input = updateAwardSchema.parse(raw);
  const before = await db.award.findUnique({ where: { id: awardId }, include: { application: { select: { id: true, reference: true, applicantUserId: true } } } });
  if (!before) throw new NotFoundError("Award not found.");
  await db.$transaction(async (tx) => {
    await tx.award.update({
      where: { id: awardId },
      data: { status: input.status, acceptanceStatus: input.acceptanceStatus, conditions: input.conditions ?? null, applicantSummary: input.applicantSummary ?? null, internalNotes: input.internalNotes ?? null },
    });
    const pick = (a: typeof before) => ({ status: a.status, acceptanceStatus: a.acceptanceStatus, conditions: a.conditions, applicantSummary: a.applicantSummary, internalNotes: a.internalNotes });
    await recordAudit({
      actor, action: "award.updated", entityType: "Award", entityId: awardId, summary: `Award ${before.reference} updated`,
      before: pick(before), after: { status: input.status, acceptanceStatus: input.acceptanceStatus, conditions: input.conditions ?? null, applicantSummary: input.applicantSummary ?? null, internalNotes: input.internalNotes ?? null }, reason: input.reason,
    }, tx);
    await syncApplicationStatus(tx, awardId, actor);
    if (before.status !== input.status || before.acceptanceStatus !== input.acceptanceStatus || before.applicantSummary !== (input.applicantSummary ?? null)) {
      await notify({ userId: before.application.applicantUserId, type: "AWARD_UPDATED", title: "Award record updated", body: `The award record for ${before.application.reference} was updated by staff.`, href: `/dashboard/applications/${before.application.id}` }, tx);
    }
  });
}

export async function changeAwardAmount(actor: Actor, awardId: string, raw: unknown) {
  assertCan(actor.role, "award:manage");
  const input = changeAwardAmountSchema.parse(raw);
  const award = await db.award.findUnique({ where: { id: awardId }, include: { disbursements: true } });
  if (!award) throw new NotFoundError("Award not found.");
  const amountMinor = minorOrThrow(input.amount, award.currency);
  const scheduled = award.disbursements.filter((d) => isCounting(d.status)).reduce((a, d) => a + d.amountMinor, 0);
  if (amountMinor < scheduled) {
    throw new ValidationError(`The new amount is below the ${formatMinor(scheduled, award.currency)} already scheduled. Adjust or cancel instalments first.`, { amount: ["Below the amount already scheduled."] });
  }
  await db.$transaction(async (tx) => {
    await tx.award.update({ where: { id: awardId }, data: { amountMinor } });
    await recordAudit({ actor, action: "award.amount_changed", entityType: "Award", entityId: awardId, summary: `Award ${award.reference} amount changed`, before: { amountMinor: award.amountMinor }, after: { amountMinor }, reason: input.reason }, tx);
    await syncApplicationStatus(tx, awardId, actor);
  });
}

// ---------------------------------------------------------------- disbursements
export async function createDisbursement(actor: Actor, raw: unknown) {
  assertCan(actor.role, "award:manage");
  const input = createDisbursementSchema.parse(raw);
  const award = await db.award.findUnique({ where: { id: input.awardId }, include: { disbursements: true, application: { select: { id: true, reference: true, applicantUserId: true } } } });
  if (!award) throw new NotFoundError("Award not found.");
  if (award.status === "CANCELLED") throw new ValidationError("This award is cancelled; instalments cannot be added.");
  const amountMinor = minorOrThrow(input.amount, award.currency);
  const check = validateScheduleTotal(award.amountMinor, award.disbursements, amountMinor);
  if (!check.ok) {
    throw new ValidationError(`${check.message} Remaining unscheduled balance: ${formatMinor(check.remainingMinor, award.currency)}.`, { amount: [`Exceeds the remaining balance of ${formatMinor(check.remainingMinor, award.currency)}.`] });
  }
  return db.$transaction(async (tx) => {
    const d = await withUniqueReference(
      () => buildReference("DSB", true),
      (reference) =>
        tx.disbursement.create({
          data: {
            reference, awardId: award.id, amountMinor, currency: award.currency, plannedDate: input.plannedDate, milestone: input.milestone ?? null,
            applicantNote: input.applicantNote ?? null, internalNotes: input.internalNotes ?? null, status: "SCHEDULED", updatedById: actor.id,
          },
        }),
    );
    await tx.disbursementEvent.create({ data: { disbursementId: d.id, fromStatus: null, toStatus: "SCHEDULED", amountMinor, actorId: actor.id, reason: "Instalment scheduled." } });
    await recordAudit({ actor, action: "disbursement.scheduled", entityType: "Disbursement", entityId: d.id, summary: `Instalment ${d.reference} scheduled on ${award.reference}: ${formatMinor(amountMinor, award.currency)}`, after: { amountMinor, plannedDate: input.plannedDate, status: "SCHEDULED" } }, tx);
    await notify({ userId: award.application.applicantUserId, type: "DISBURSEMENT_SCHEDULED", title: "Disbursement scheduled", body: `A planned instalment of ${formatMinor(amountMinor, award.currency)} was recorded for ${award.application.reference}. Planned dates are not a guarantee of payment.`, href: `/dashboard/applications/${award.application.id}` }, tx);
    await syncApplicationStatus(tx, award.id, actor);
    return d;
  });
}

export async function updateDisbursement(actor: Actor, id: string, raw: unknown) {
  assertCan(actor.role, "award:manage");
  const input = updateDisbursementSchema.parse(raw);
  const d = await db.disbursement.findUnique({ where: { id }, include: { award: { include: { disbursements: true } } } });
  if (!d) throw new NotFoundError("Disbursement not found.");
  if (LOCKED_FOR_EDIT.includes(d.status as DisbursementStatus)) {
    throw new ValidationError(`A disbursement in "${DISBURSEMENT_LABELS[d.status as DisbursementStatus]}" can no longer be edited. Record a status change with a reason instead.`);
  }
  const amountMinor = minorOrThrow(input.amount, d.currency);
  const others = d.award.disbursements.filter((x) => x.id !== d.id);
  const check = validateScheduleTotal(d.award.amountMinor, others, amountMinor, isCounting(d.status));
  if (!check.ok) throw new ValidationError(`${check.message} Remaining: ${formatMinor(check.remainingMinor, d.currency)}.`, { amount: ["Exceeds the remaining balance."] });
  await db.$transaction(async (tx) => {
    await tx.disbursement.update({
      where: { id }, data: { amountMinor, plannedDate: input.plannedDate, milestone: input.milestone ?? null, applicantNote: input.applicantNote ?? null, internalNotes: input.internalNotes ?? null, updatedById: actor.id },
    });
    await recordAudit({
      actor, action: "disbursement.updated", entityType: "Disbursement", entityId: id, summary: `Instalment ${d.reference} edited`,
      before: { amountMinor: d.amountMinor, plannedDate: d.plannedDate, milestone: d.milestone, applicantNote: d.applicantNote, internalNotes: d.internalNotes },
      after: { amountMinor, plannedDate: input.plannedDate, milestone: input.milestone ?? null, applicantNote: input.applicantNote ?? null, internalNotes: input.internalNotes ?? null }, reason: input.reason,
    }, tx);
    await tx.disbursementEvent.create({ data: { disbursementId: id, fromStatus: d.status, toStatus: d.status, amountMinor, actorId: actor.id, reason: `Edited: ${input.reason}` } });
    await syncApplicationStatus(tx, d.awardId, actor);
  });
}

export async function changeDisbursementStatus(actor: Actor, id: string, raw: unknown) {
  assertCan(actor.role, "award:manage");
  const input = changeDisbursementStatusSchema.parse(raw);
  const d = await db.disbursement.findUnique({ where: { id }, include: { award: { include: { application: { select: { id: true, reference: true, applicantUserId: true } }, disbursements: true } } } });
  if (!d) throw new NotFoundError("Disbursement not found.");
  const from = d.status as DisbursementStatus;
  if (!DISBURSEMENT_TRANSITIONS[from]?.includes(input.to)) {
    throw new ValidationError(`A disbursement cannot move from "${DISBURSEMENT_LABELS[from]}" to "${DISBURSEMENT_LABELS[input.to]}".`);
  }
  if (REQUIRES_MANUAL_ACK.includes(input.to) && !input.acknowledgeManual) {
    throw new ValidationError("Confirm that you are manually recording this status and that it is not verified by a payment provider.", { acknowledgeManual: ["Please confirm this is a manual record."] });
  }
  // Re-scheduling a cancelled/failed/held plan must still fit inside the award.
  if (!isCounting(from) && isCounting(input.to)) {
    const others = d.award.disbursements.filter((x) => x.id !== d.id);
    const check = validateScheduleTotal(d.award.amountMinor, others, d.amountMinor);
    if (!check.ok) throw new ValidationError(`${check.message}`);
  }
  await db.$transaction(async (tx) => {
    const updated = await tx.disbursement.updateMany({
      where: { id, status: from },
      data: { status: input.to, updatedById: actor.id, ...(REQUIRES_MANUAL_ACK.includes(input.to) ? { manualRecordNote: input.reason } : {}) },
    });
    if (updated.count === 0) throw new ValidationError("This record was changed by someone else. Reload and try again.");
    await tx.disbursementEvent.create({ data: { disbursementId: id, fromStatus: from, toStatus: input.to, amountMinor: d.amountMinor, actorId: actor.id, reason: input.reason } });
    await recordAudit({
      actor, action: "disbursement.status_changed", entityType: "Disbursement", entityId: id,
      summary: `Instalment ${d.reference}: ${DISBURSEMENT_LABELS[from]} → ${DISBURSEMENT_LABELS[input.to]} (manual entry)`,
      before: { status: from }, after: { status: input.to }, reason: input.reason,
    }, tx);
    await notify({
      userId: d.award.application.applicantUserId, type: "DISBURSEMENT_UPDATED", title: "Disbursement record updated",
      body: `An instalment on ${d.award.application.reference} is now recorded as "${DISBURSEMENT_LABELS[input.to]}" by staff. This is a staff-entered record, not a payment-provider confirmation.`,
      href: `/dashboard/applications/${d.award.application.id}`,
    }, tx);
    await syncApplicationStatus(tx, d.awardId, actor);
  });
}

// ---------------------------------------------------------------- reads
export type AwardListParams = { q?: string; awardStatus?: string; disbursementStatus?: string; opportunityId?: string; mode?: string; from?: string; to?: string; page?: number; pageSize?: number };

export async function listAwards(actor: Actor, p: AwardListParams = {}) {
  assertCan(actor.role, "award:view");
  const pageSize = p.pageSize ?? 15;
  const page = Math.max(p.page ?? 1, 1);
  const and: Prisma.AwardWhereInput[] = [];
  if (p.q) and.push({ OR: [{ reference: { contains: p.q } }, { application: { reference: { contains: p.q } } }, { disbursements: { some: { reference: { contains: p.q } } } }] });
  if (p.awardStatus) and.push({ status: p.awardStatus });
  if (p.disbursementStatus) and.push({ disbursements: { some: { status: p.disbursementStatus } } });
  if (p.opportunityId) and.push({ application: { opportunityId: p.opportunityId } });
  if (p.mode) and.push({ application: { applicantMode: p.mode } });
  if (p.from) and.push({ approvedAt: { gte: new Date(`${p.from}T00:00:00.000Z`) } });
  if (p.to) and.push({ approvedAt: { lte: new Date(`${p.to}T23:59:59.999Z`) } });
  const where: Prisma.AwardWhereInput = and.length ? { AND: and } : {};
  const [rows, total] = await Promise.all([
    db.award.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      include: {
        disbursements: true,
        application: { select: { id: true, reference: true, applicantMode: true, applicant: { select: { name: true } }, organization: { select: { name: true } }, opportunity: { select: { title: true, reference: true, classification: true } } } },
      },
    }),
    db.award.count({ where }),
  ]);
  return { rows: rows.map((a) => ({ ...a, summary: summarizeAward(a.amountMinor, a.disbursements) })), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getAwardAdmin(actor: Actor, id: string) {
  assertCan(actor.role, "award:view");
  const award = await db.award.findUnique({
    where: { id },
    include: {
      disbursements: { orderBy: { plannedDate: "asc" }, include: { events: { orderBy: { createdAt: "asc" } } } },
      application: { select: { id: true, reference: true, status: true, applicantMode: true, applicant: { select: { name: true } }, organization: { select: { name: true } }, opportunity: { select: { title: true, reference: true, classification: true } } } },
    },
  });
  if (!award) throw new NotFoundError("Award not found.");
  const userIds = [...new Set([award.approvedById, award.createdById, ...award.disbursements.flatMap((d) => d.events.map((e) => e.actorId))])];
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const history = await db.auditLog.findMany({
    where: { OR: [{ entityType: "Award", entityId: id }, { entityType: "Disbursement", entityId: { in: award.disbursements.map((d) => d.id) } }] },
    orderBy: { createdAt: "desc" }, take: 60,
  });
  return { award, summary: summarizeAward(award.amountMinor, award.disbursements), people: Object.fromEntries(users.map((u) => [u.id, u.name])), history };
}

/** Awards available to creating: approved applications that have no award yet. */
export async function approvedWithoutAward(actor: Actor) {
  assertCan(actor.role, "award:view");
  return db.application.findMany({
    where: { status: "APPROVED", award: null },
    select: { id: true, reference: true, opportunity: { select: { title: true, currency: true, fundingSpecified: true, fixedAmountMinor: true } } },
    orderBy: { decidedAt: "desc" },
  });
}

export async function awardTotals(actor: Actor) {
  assertCan(actor.role, "award:view");
  const awards = await db.award.findMany({ where: { status: { not: "CANCELLED" } }, include: { disbursements: true } });
  const byCurrency = new Map<string, { awarded: number; scheduled: number; paid: number; outstanding: number; overdue: number; count: number }>();
  for (const a of awards) {
    const s = summarizeAward(a.amountMinor, a.disbursements);
    const row = byCurrency.get(a.currency) ?? { awarded: 0, scheduled: 0, paid: 0, outstanding: 0, overdue: 0, count: 0 };
    row.awarded += s.awardMinor;
    row.scheduled += s.scheduledMinor;
    row.paid += s.paidRecordedMinor;
    row.outstanding += s.outstandingMinor;
    row.overdue += s.overdueCount;
    row.count += 1;
    byCurrency.set(a.currency, row);
  }
  return [...byCurrency.entries()].map(([currency, v]) => ({ currency, ...v }));
}

/** Applicant-side list of their own award + planned instalments (applicant-safe fields only). */
export async function listApplicantAwards(actor: Actor) {
  if (!isApplicantRole(actor.role)) throw new ForbiddenError();
  const orgIds = await memberOrganizationIds(actor.id);
  const awards = await db.award.findMany({
    where: { application: { OR: [{ applicantUserId: actor.id }, ...(orgIds.length ? [{ organizationId: { in: orgIds } }] : [])] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, reference: true, amountMinor: true, currency: true, status: true, acceptanceStatus: true, conditions: true, applicantSummary: true, approvedAt: true,
      application: { select: { id: true, reference: true, opportunity: { select: { title: true, classification: true } } } },
      disbursements: { orderBy: { plannedDate: "asc" }, select: { id: true, reference: true, amountMinor: true, currency: true, plannedDate: true, milestone: true, status: true, applicantNote: true, updatedAt: true } },
    },
  });
  return awards.map((a) => ({ ...a, summary: summarizeAward(a.amountMinor, a.disbursements) }));
}
