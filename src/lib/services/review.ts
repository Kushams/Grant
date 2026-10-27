import { db } from "../db";
import { STATUS_LABELS, type ApplicationStatus } from "../constants";
import { assertCan, ForbiddenError, NotFoundError, ValidationError, type Actor } from "../permissions";
import { assignSchema, decisionSchema, infoRequestSchema, moveStatusSchema, noteSchema, recommendSchema } from "../validation/review";
import { applyTransition, assertStaffAccess } from "./applications";
import { recordAudit } from "./audit";
import { notify, notifyAdmins } from "./notifications";

async function load(actor: Actor, appId: string) {
  assertCan(actor.role, "application:review");
  await assertStaffAccess(actor, appId); // reviewers: assigned applications only
  const app = await db.application.findUnique({ where: { id: appId }, select: { id: true, reference: true, status: true, applicantUserId: true } });
  if (!app) throw new NotFoundError("Application not found.");
  return app;
}

export async function assignReviewer(actor: Actor, appId: string, raw: unknown) {
  assertCan(actor.role, "application:assign");
  const { reviewerId } = assignSchema.parse(raw);
  const app = await db.application.findUnique({ where: { id: appId }, select: { id: true, reference: true, status: true } });
  if (!app || app.status === "DRAFT") throw new NotFoundError("Application not found.");
  const reviewer = await db.user.findFirst({ where: { id: reviewerId, isActive: true, role: { in: ["REVIEWER", "ADMIN"] } }, select: { id: true, name: true } });
  if (!reviewer) throw new ValidationError("Choose an active reviewer.");
  await db.$transaction(async (tx) => {
    const current = await tx.applicationAssignment.findMany({ where: { applicationId: appId, isActive: true }, include: { reviewer: { select: { name: true } } } });
    if (current.length === 1 && current[0].reviewerId === reviewerId) throw new ValidationError("That reviewer is already assigned.");
    await tx.applicationAssignment.updateMany({ where: { applicationId: appId, isActive: true }, data: { isActive: false, endedAt: new Date() } });
    await tx.applicationAssignment.create({ data: { applicationId: appId, reviewerId, assignedById: actor.id } });
    await recordAudit({
      actor, action: "application.reviewer_assigned", entityType: "Application", entityId: appId,
      summary: `${app.reference}: assigned to ${reviewer.name}`,
      before: { reviewers: current.map((c) => c.reviewer.name) }, after: { reviewer: reviewer.name },
    }, tx);
    await notify({ userId: reviewerId, type: "STAFF_ASSIGNED", title: "Application assigned to you", body: `${app.reference} is now in your review queue.`, href: `/admin/applications/${appId}` }, tx);
  });
}

export async function addReviewNote(actor: Actor, appId: string, raw: unknown) {
  const { body } = noteSchema.parse(raw);
  const app = await load(actor, appId);
  await db.reviewNote.create({ data: { applicationId: app.id, authorId: actor.id, kind: "NOTE", body } });
}

export async function requestInformation(actor: Actor, appId: string, raw: unknown) {
  const { message } = infoRequestSchema.parse(raw);
  const app = await load(actor, appId);
  await db.$transaction(async (tx) => {
    await tx.applicationMessage.create({ data: { applicationId: app.id, authorId: actor.id, authorRole: actor.role, kind: "INFO_REQUEST", body: message } });
    await applyTransition(tx, {
      appId: app.id, to: "INFO_REQUESTED", actor, publicNote: "Additional information requested.", internalNote: message,
      notifyApplicant: { title: "Additional information requested", body: `The review team has asked for more information on ${app.reference}. Please reply from your application page.` },
    });
  });
}

export async function requestRevision(actor: Actor, appId: string, raw: unknown) {
  const { message } = infoRequestSchema.parse(raw);
  const app = await load(actor, appId);
  await db.$transaction(async (tx) => {
    await tx.applicationMessage.create({ data: { applicationId: app.id, authorId: actor.id, authorRole: actor.role, kind: "REVISION_REQUEST", body: message } });
    await applyTransition(tx, {
      appId: app.id, to: "RESUBMISSION_REQUIRED", actor, publicNote: "Revision requested.", internalNote: message,
      notifyApplicant: { title: "Revision requested", body: `Changes are needed on ${app.reference} before review can continue. Edit and resubmit from your application page.` },
    });
  });
}

/** Generic mover for the simple review states; dedicated functions handle the others. */
export async function moveStatus(actor: Actor, appId: string, raw: unknown) {
  const { to, note } = moveStatusSchema.parse(raw);
  const allowed: ApplicationStatus[] = ["INITIAL_REVIEW", "UNDER_REVIEW", "CLOSED"];
  if (!allowed.includes(to as ApplicationStatus)) throw new ValidationError("That status change has its own dedicated action.");
  const app = await load(actor, appId);
  await db.$transaction(async (tx) => {
    await applyTransition(tx, { appId: app.id, to: to as ApplicationStatus, actor, internalNote: note });
  });
}

/**
 * A reviewer's RECOMMENDATION is kept separate from the administrator's FINAL decision.
 * Recommending approval moves the file to "Recommended for approval"; recommending decline
 * is recorded for the administrator without changing the applicant-visible status.
 */
export async function recommend(actor: Actor, appId: string, raw: unknown) {
  const { recommendation, body } = recommendSchema.parse(raw);
  const app = await load(actor, appId);
  await db.$transaction(async (tx) => {
    await tx.reviewNote.create({ data: { applicationId: app.id, authorId: actor.id, kind: "RECOMMENDATION", recommendation, body } });
    await tx.decisionRecord.create({ data: { applicationId: app.id, kind: "RECOMMENDATION", outcome: recommendation, decidedById: actor.id, reason: body } });
    if (recommendation === "APPROVE") {
      await applyTransition(tx, { appId: app.id, to: "RECOMMENDED", actor, internalNote: body, notifyApplicant: false });
    } else {
      await recordAudit({ actor, action: "application.recommendation_recorded", entityType: "Application", entityId: app.id, summary: `${app.reference}: recommended DECLINE`, reason: body }, tx);
    }
    await notifyAdmins({ type: "STAFF_RECOMMENDATION", title: `Recommendation: ${recommendation === "APPROVE" ? "approve" : "decline"}`, body: `${app.reference} — ${actor.name} recorded a recommendation awaiting a final decision.`, href: `/admin/applications/${app.id}` }, tx);
  });
}

/** Final decision — administrators only. Approval requires the file to be "Recommended". */
export async function decide(actor: Actor, appId: string, raw: unknown) {
  assertCan(actor.role, "application:decide");
  const input = decisionSchema.parse(raw);
  const app = await db.application.findUnique({ where: { id: appId }, select: { id: true, reference: true, status: true } });
  if (!app || app.status === "DRAFT") throw new NotFoundError("Application not found.");
  const to: ApplicationStatus = input.outcome === "APPROVE" ? "APPROVED" : "DECLINED";
  await db.$transaction(async (tx) => {
    const decision = await tx.decisionRecord.create({
      data: { applicationId: app.id, kind: "FINAL", outcome: input.outcome, decidedById: actor.id, reason: input.reason, internalNotes: input.internalNotes ?? null, applicantMessage: input.applicantMessage ?? null },
    });
    if (input.applicantMessage) {
      await tx.applicationMessage.create({ data: { applicationId: app.id, authorId: actor.id, authorRole: actor.role, kind: "DECISION", body: input.applicantMessage } });
    }
    await applyTransition(tx, {
      appId: app.id, to, actor, internalNote: input.reason, publicNote: input.applicantMessage,
      notifyApplicant: {
        title: `Decision recorded: ${STATUS_LABELS[to]}`,
        body: `A decision has been recorded on ${app.reference}: ${STATUS_LABELS[to]}.${to === "APPROVED" ? " Award terms, if any, will appear on your application page once staff record them." : ""}`,
      },
    });
    await recordAudit({ actor, action: "application.decision_recorded", entityType: "Application", entityId: app.id, summary: `${app.reference}: final decision ${input.outcome}`, after: { decisionId: decision.id, outcome: input.outcome }, reason: input.reason }, tx);
  });
}

export { ForbiddenError };
