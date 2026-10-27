import type { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "../db";
import {
  APPLICANT_EDITABLE,
  INDIVIDUAL_CATEGORIES,
  STATUS_LABELS,
  TERMINAL_FOR_ACTIVE_KEY,
  isApplicantRole,
  type ApplicationStatus,
} from "../constants";
import { ForbiddenError, NotFoundError, ValidationError, type Actor } from "../permissions";
import { actorKindFor, canTransition, type ActorKind } from "../status";
import { checkEligibility } from "../eligibility";
import { buildReference, withUniqueReference } from "../references";
import { parseAmountToMinor } from "../money";
import { ORG } from "@/config/organization";
import { applicantReplySchema, normalizeAnswer, stepOneSchema, submitSchema, validateAnswer, withdrawSchema } from "../validation/application";
import { isIndividualApplyReady, isOrganizationApplyReady } from "../validation/profile";
import { toView, type OpportunityView } from "./opportunities";
import { assessCompleteness } from "../completeness";
import { recordAudit } from "./audit";
import { notify, notifyAdmins, notifyMany } from "./notifications";

export const STEP_SECTIONS: Record<number, "GENERAL" | "PROJECT" | "SUPPORTING"> = { 3: "GENERAL", 4: "PROJECT", 5: "SUPPORTING" };
export const TOTAL_STEPS = 6;

const appInclude = {
  opportunity: { include: { questions: true } },
  answers: true,
  organization: true,
} satisfies Prisma.ApplicationInclude;
type AppFull = Prisma.ApplicationGetPayload<{ include: typeof appInclude }>;

const activeKeyFor = (opportunityId: string, ownerId: string) => `${opportunityId}:${ownerId}`;

// ---------------------------------------------------------------- ownership
/** Ids of organizations the user belongs to (explicit membership rows only). */
export async function memberOrganizationIds(userId: string): Promise<string[]> {
  const rows = await db.organizationMembership.findMany({ where: { userId }, select: { organizationId: true } });
  return rows.map((r) => r.organizationId);
}

async function loadOwned(actor: Actor, id: string): Promise<AppFull> {
  if (!isApplicantRole(actor.role)) throw new ForbiddenError();
  const app = await db.application.findUnique({ where: { id }, include: appInclude });
  if (!app) throw new NotFoundError("Application not found.");
  const orgIds = await memberOrganizationIds(actor.id);
  const owns = app.applicantUserId === actor.id || (app.organizationId !== null && orgIds.includes(app.organizationId));
  if (!owns) throw new NotFoundError("Application not found."); // do not reveal existence
  return app;
}

// ---------------------------------------------------------------- central transition
export type TransitionInput = {
  appId: string;
  to: ApplicationStatus;
  actor: Actor | null; // null = system
  internalNote?: string;
  publicNote?: string;
  notifyApplicant?: { title: string; body: string } | false;
  allowSystem?: boolean;
};

/**
 * The ONE place an application's status changes. Validates against the transition map for the
 * actor's kind, writes the timeline event, frees the duplicate-slot key on withdrawal and
 * (by default) creates an in-app notification for the applicant.
 */
export async function applyTransition(tx: Tx, t: TransitionInput) {
  const app = await tx.application.findUnique({ where: { id: t.appId } });
  if (!app) throw new NotFoundError("Application not found.");
  const from = app.status as ApplicationStatus;
  const kind: ActorKind = t.actor ? actorKindFor(t.actor.role) : "SYSTEM";
  if (!canTransition(from, t.to, kind)) {
    throw new ValidationError(`This application cannot move from "${STATUS_LABELS[from]}" to "${STATUS_LABELS[t.to]}".`);
  }
  // Optimistic guard against concurrent changes.
  const changed = await tx.application.updateMany({
    where: { id: app.id, status: from },
    data: {
      status: t.to,
      lastActivityAt: new Date(),
      ...(t.to === "APPROVED" || t.to === "DECLINED" ? { decidedAt: new Date() } : {}),
      ...(TERMINAL_FOR_ACTIVE_KEY.includes(t.to) ? { activeKey: null } : {}),
    },
  });
  if (changed.count === 0) throw new ValidationError("This application was changed by someone else. Please reload and try again.");
  await tx.applicationStatusEvent.create({
    data: {
      applicationId: app.id,
      fromStatus: from,
      toStatus: t.to,
      actorId: t.actor?.id ?? null,
      actorRole: t.actor?.role ?? "SYSTEM",
      internalNote: t.internalNote ?? null,
      publicNote: t.publicNote ?? null,
    },
  });
  await recordAudit(
    {
      actor: t.actor,
      action: "application.status_changed",
      entityType: "Application",
      entityId: app.id,
      summary: `${app.reference ?? "Draft"}: ${STATUS_LABELS[from]} → ${STATUS_LABELS[t.to]}`,
      before: { status: from },
      after: { status: t.to },
      reason: t.internalNote ?? t.publicNote ?? null,
    },
    tx,
  );
  if (t.notifyApplicant !== false) {
    const n = t.notifyApplicant ?? {
      title: `Application status updated: ${STATUS_LABELS[t.to]}`,
      body: `${app.reference ?? "Your application"} is now "${STATUS_LABELS[t.to]}".${t.publicNote ? ` ${t.publicNote}` : ""}`,
    };
    await notify({ userId: app.applicantUserId, type: "APPLICATION_STATUS", href: `/dashboard/applications/${app.id}`, ...n }, tx);
  }
  return { ...app, status: t.to };
}

// ---------------------------------------------------------------- start / resume
async function chooseCategory(actor: Actor, opp: OpportunityView, organizationId?: string) {
  if (actor.role === "INDIVIDUAL_APPLICANT") {
    const profile = await db.individualProfile.findUnique({ where: { userId: actor.id } });
    const preferred = profile?.applicantCategory ?? "INDIVIDUAL";
    const candidates = [preferred, ...INDIVIDUAL_CATEGORIES.filter((c) => c !== preferred)];
    const firstOk = candidates.find((c) => checkEligibility(opp, c).eligible);
    if (!firstOk) throw new ValidationError(checkEligibility(opp, preferred).reasons.join(" "));
    return { mode: "INDIVIDUAL" as const, category: firstOk, organizationId: null as string | null };
  }
  const orgs = await db.organizationMembership.findMany({ where: { userId: actor.id }, include: { organization: true }, orderBy: { createdAt: "asc" } });
  const membership = organizationId ? orgs.find((m) => m.organizationId === organizationId) : orgs[0];
  if (!membership) throw new ForbiddenError("Create or join an organization profile before applying.");
  const category = membership.organization.type;
  const eligibility = checkEligibility(opp, category);
  if (!eligibility.eligible) throw new ValidationError(eligibility.reasons.join(" "));
  return { mode: "ORGANIZATION" as const, category, organizationId: membership.organizationId };
}

/** Starts a new draft, or returns the applicant's existing draft/active application. */
export async function startOrResumeApplication(actor: Actor, slug: string, organizationId?: string): Promise<{ id: string; created: boolean }> {
  if (!isApplicantRole(actor.role)) throw new ForbiddenError("Only applicant accounts can start applications.");
  const row = await db.opportunity.findFirst({ where: { slug, status: "PUBLISHED" }, include: { questions: true } });
  if (!row) throw new NotFoundError("Opportunity not found.");
  const opp = toView(row);
  const choice = await chooseCategory(actor, opp, organizationId);
  const ownerId = choice.organizationId ?? actor.id;

  const existing = await db.application.findFirst({
    where: {
      opportunityId: opp.id,
      ...(choice.organizationId ? { organizationId: choice.organizationId } : { applicantUserId: actor.id, organizationId: null }),
      status: { not: "WITHDRAWN" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing && (!opp.allowMultipleApplications || APPLICANT_EDITABLE.includes(existing.status as ApplicationStatus))) {
    return { id: existing.id, created: false };
  }

  try {
    const app = await db.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          opportunityId: opp.id,
          applicantUserId: actor.id,
          organizationId: choice.organizationId,
          applicantMode: choice.mode,
          applicantCategory: choice.category,
          status: "DRAFT",
          activeKey: opp.allowMultipleApplications ? null : activeKeyFor(opp.id, ownerId),
        },
      });
      await tx.applicationStatusEvent.create({
        data: { applicationId: created.id, fromStatus: null, toStatus: "DRAFT", actorId: actor.id, actorRole: actor.role, publicNote: "Draft started." },
      });
      return created;
    });
    return { id: app.id, created: true };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      // Lost a race with a concurrent request: the DB unique key kept us to one application.
      const winner = await db.application.findFirst({ where: { activeKey: activeKeyFor(opp.id, ownerId) } });
      if (winner) return { id: winner.id, created: false };
    }
    throw err;
  }
}

// ---------------------------------------------------------------- editing
export async function getApplicationForEdit(actor: Actor, id: string) {
  const app = await loadOwned(actor, id);
  const opp = toView(app.opportunity);
  const answers: Record<string, string> = Object.fromEntries(app.answers.map((a) => [a.questionKey, a.value]));
  const individual = actor.role === "INDIVIDUAL_APPLICANT" ? await db.individualProfile.findUnique({ where: { userId: actor.id } }) : null;
  const orgs = actor.role === "ORGANIZATION_APPLICANT"
    ? (await db.organizationMembership.findMany({ where: { userId: actor.id }, include: { organization: true } })).map((m) => m.organization)
    : [];
  return { app, opp, answers, individual, orgs, editable: APPLICANT_EDITABLE.includes(app.status as ApplicationStatus) };
}

export type StepPayload = {
  applicantCategory?: string;
  organizationId?: string;
  answers?: Record<string, unknown>;
  requestedAmount?: string;
};

export async function saveApplicationStep(actor: Actor, id: string, step: number, nextStep: number, payload: StepPayload) {
  const app = await loadOwned(actor, id);
  if (!APPLICANT_EDITABLE.includes(app.status as ApplicationStatus)) {
    throw new ValidationError("This application can no longer be edited.");
  }
  if (!Number.isInteger(step) || step < 1 || step > TOTAL_STEPS) throw new ValidationError("Unknown step.");
  const opp = toView(app.opportunity);
  const data: Prisma.ApplicationUpdateInput = {};

  if (step === 1) {
    const input = stepOneSchema.parse({ applicantCategory: payload.applicantCategory, organizationId: payload.organizationId });
    if (app.applicantMode === "INDIVIDUAL") {
      if (!(INDIVIDUAL_CATEGORIES as readonly string[]).includes(input.applicantCategory)) throw new ValidationError("Choose Individual or Entrepreneur.");
      data.applicantCategory = input.applicantCategory;
    } else {
      const orgId = input.organizationId ?? app.organizationId;
      const m = orgId ? await db.organizationMembership.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId: actor.id } }, include: { organization: true } }) : null;
      if (!m) throw new ForbiddenError("You do not have access to that organization.");
      data.applicantCategory = m.organization.type;
      if (orgId !== app.organizationId) {
        data.organization = { connect: { id: orgId! } };
        if (app.activeKey) data.activeKey = activeKeyFor(opp.id, orgId!);
      }
    }
    const eligibility = checkEligibility(opp, data.applicantCategory as string);
    if (!eligibility.eligible) throw new ValidationError(eligibility.reasons.join(" "));
  } else if (STEP_SECTIONS[step]) {
    const section = STEP_SECTIONS[step];
    const questions = opp.questions.filter((q) => q.section === section);
    const fieldErrors: Record<string, string[]> = {};
    const toSave: Array<{ key: string; label: string; section: string; value: string }> = [];
    const toClear: string[] = [];
    for (const q of questions) {
      if (!payload.answers || !(q.key in payload.answers)) continue;
      const value = normalizeAnswer(payload.answers[q.key]);
      const err = validateAnswer({ ...q, options: q.optionList }, value, false);
      if (err) fieldErrors[`answers.${q.key}`] = [err];
      else if (value === "" || value === "[]") toClear.push(q.key);
      else toSave.push({ key: q.key, label: q.label, section: q.section, value });
    }
    if (step === 4 && opp.fundingSpecified && opp.fixedAmountMinor == null && payload.requestedAmount !== undefined) {
      const text = payload.requestedAmount.trim();
      if (text === "") data.requestedAmountMinor = null;
      else {
        const minor = parseAmountToMinor(text, opp.currency);
        if (minor === null || minor <= 0) fieldErrors["requestedAmount"] = ["Enter a valid amount."];
        else if (opp.minAmountMinor != null && minor < opp.minAmountMinor) fieldErrors["requestedAmount"] = ["That is below this programme's minimum."];
        else if (opp.maxAmountMinor != null && minor > opp.maxAmountMinor) fieldErrors["requestedAmount"] = ["That is above this programme's maximum."];
        else data.requestedAmountMinor = minor;
      }
    }
    if (Object.keys(fieldErrors).length) throw new ValidationError("Please correct the highlighted answers.", fieldErrors);
    await db.$transaction(async (tx) => {
      for (const a of toSave) {
        await tx.applicationAnswer.upsert({
          where: { applicationId_questionKey: { applicationId: app.id, questionKey: a.key } },
          create: { applicationId: app.id, questionKey: a.key, questionLabel: a.label, section: a.section, value: a.value },
          update: { value: a.value, questionLabel: a.label },
        });
      }
      if (toClear.length) await tx.applicationAnswer.deleteMany({ where: { applicationId: app.id, questionKey: { in: toClear } } });
    });
  }

  const target = Math.min(Math.max(nextStep, 1), TOTAL_STEPS);
  await db.application.update({ where: { id: app.id }, data: { ...data, currentStep: target, lastActivityAt: new Date() } });
  return { currentStep: target };
}

// ---------------------------------------------------------------- submit
export async function submitApplication(actor: Actor, id: string, rawConsent: unknown) {
  const consent = submitSchema.safeParse(rawConsent);
  if (!consent.success) throw consent.error;
  const app = await loadOwned(actor, id);
  const from = app.status as ApplicationStatus;
  if (!APPLICANT_EDITABLE.includes(from)) throw new ValidationError("This application has already been submitted.");
  const opp = toView(app.opportunity);

  const eligibility = checkEligibility(opp, app.applicantCategory);
  if (!eligibility.eligible) throw new ValidationError(eligibility.reasons.join(" "));

  // Profile must be complete enough to review.
  if (app.applicantMode === "INDIVIDUAL") {
    const p = await db.individualProfile.findUnique({ where: { userId: actor.id } });
    if (!isIndividualApplyReady(p)) throw new ValidationError("Complete your profile (name and country) before submitting.");
  } else if (!isOrganizationApplyReady(app.organization)) {
    throw new ValidationError("Complete your organization profile (name, country and contact email) before submitting.");
  }

  const answers = Object.fromEntries(app.answers.map((a) => [a.questionKey, a.value]));
  const completeness = assessCompleteness(opp, answers, { requestedAmountMinor: app.requestedAmountMinor });
  if (completeness.missing.length || completeness.invalid.length) {
    const fieldErrors: Record<string, string[]> = {};
    for (const m of completeness.missing) (fieldErrors["_form"] ??= []).push(`Required: ${m.label} (step ${m.step})`);
    for (const m of completeness.invalid) (fieldErrors["_form"] ??= []).push(`${m.label}: ${m.message}`);
    throw new ValidationError("Some required information is missing or invalid.", fieldErrors);
  }

  return db.$transaction(async (tx) => {
    const firstSubmission = !app.submittedAt;
    const reference = app.reference
      ? app.reference
      : await withUniqueReference(
          () => buildReference("APP", opp.isDemo),
          async (ref) => {
            await tx.application.update({ where: { id: app.id }, data: { reference: ref } });
            return ref;
          },
        );
    // Ensure the status machine allows this (DRAFT / RESUBMISSION_REQUIRED -> SUBMITTED).
    await tx.application.update({
      where: { id: app.id },
      data: { consentAcceptedAt: new Date(), ...(firstSubmission ? { submittedAt: new Date() } : {}) },
    });
    await applyTransition(tx, {
      appId: app.id,
      to: "SUBMITTED",
      actor,
      publicNote: firstSubmission ? "Application submitted." : "Application resubmitted after requested changes.",
      notifyApplicant: {
        title: firstSubmission ? "Application submitted" : "Application resubmitted",
        body: `Your application ${reference} for "${opp.title}" was recorded. ${ORG.name} cannot guarantee any outcome; you can track progress from your dashboard.`,
      },
    });
    await tx.consentRecord.create({
      data: { userId: actor.id, subject: "APPLICATION_SUBMISSION", applicationId: app.id, documentVersion: ORG.policyVersion },
    });
    await notifyAdmins({ type: "STAFF_NEW_APPLICATION", title: "New application submitted", body: `${reference} for ${opp.reference}.`, href: `/admin/applications/${app.id}` }, tx);
    return { id: app.id, reference };
  });
}

// ---------------------------------------------------------------- applicant actions
export async function withdrawApplication(actor: Actor, id: string, raw: unknown) {
  const { reason } = withdrawSchema.parse(raw ?? {});
  const app = await loadOwned(actor, id);
  await db.$transaction(async (tx) => {
    await applyTransition(tx, {
      appId: app.id,
      to: "WITHDRAWN",
      actor,
      publicNote: reason || "Withdrawn by the applicant.",
      notifyApplicant: { title: "Application withdrawn", body: `${app.reference ?? "Your draft"} was withdrawn at your request.` },
    });
  });
}

export async function respondToInfoRequest(actor: Actor, id: string, raw: unknown) {
  const { body } = applicantReplySchema.parse(raw);
  const app = await loadOwned(actor, id);
  if (app.status !== "INFO_REQUESTED") throw new ValidationError("There is no open information request on this application.");
  await db.$transaction(async (tx) => {
    await tx.applicationMessage.create({ data: { applicationId: app.id, authorId: actor.id, authorRole: actor.role, kind: "APPLICANT_RESPONSE", body } });
    await applyTransition(tx, { appId: app.id, to: "UNDER_REVIEW", actor, publicNote: "Applicant responded to the information request.", notifyApplicant: false });
    const reviewers = await tx.applicationAssignment.findMany({ where: { applicationId: app.id, isActive: true }, select: { reviewerId: true } });
    if (reviewers.length) await notifyMany(reviewers.map((r) => r.reviewerId), { type: "STAFF_REPLY", title: "Applicant replied", body: `${app.reference} — the applicant answered your information request.`, href: `/admin/applications/${app.id}` }, tx);
    else await notifyAdmins({ type: "STAFF_REPLY", title: "Applicant replied", body: `${app.reference} — the applicant answered an information request.`, href: `/admin/applications/${app.id}` }, tx);
  });
}

// ---------------------------------------------------------------- applicant reads
export type ApplicantListParams = { q?: string; status?: string; page?: number; pageSize?: number };

export async function listApplicantApplications(actor: Actor, p: ApplicantListParams = {}) {
  if (!isApplicantRole(actor.role)) throw new ForbiddenError();
  const orgIds = await memberOrganizationIds(actor.id);
  const pageSize = p.pageSize ?? 10;
  const page = Math.max(p.page ?? 1, 1);
  const where: Prisma.ApplicationWhereInput = {
    OR: [{ applicantUserId: actor.id }, ...(orgIds.length ? [{ organizationId: { in: orgIds } }] : [])],
    ...(p.status ? { status: p.status } : {}),
    ...(p.q ? { AND: [{ OR: [{ reference: { contains: p.q } }, { opportunity: { title: { contains: p.q } } }] }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.application.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, reference: true, status: true, submittedAt: true, updatedAt: true, currentStep: true, applicantMode: true,
        opportunity: { select: { title: true, slug: true, classification: true, reference: true } },
        organization: { select: { name: true } },
      },
    }),
    db.application.count({ where }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Applicant-facing detail. Uses explicit `select`s so internal notes can never leak. */
export async function getApplicantApplicationDetail(actor: Actor, id: string) {
  const owned = await loadOwned(actor, id);
  const app = await db.application.findUnique({
    where: { id: owned.id },
    select: {
      id: true, reference: true, status: true, submittedAt: true, decidedAt: true, updatedAt: true, currentStep: true,
      applicantMode: true, applicantCategory: true, requestedAmountMinor: true,
      opportunity: { select: { id: true, title: true, slug: true, reference: true, classification: true, currency: true } },
      organization: { select: { name: true } },
      answers: { select: { questionKey: true, questionLabel: true, section: true, value: true } },
      events: { orderBy: { createdAt: "asc" }, select: { toStatus: true, publicNote: true, createdAt: true } },
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, kind: true, body: true, authorRole: true, createdAt: true } },
      award: {
        select: {
          id: true, reference: true, amountMinor: true, currency: true, status: true, acceptanceStatus: true, conditions: true,
          applicantSummary: true, approvedAt: true,
          disbursements: {
            orderBy: { plannedDate: "asc" },
            select: { id: true, reference: true, amountMinor: true, currency: true, plannedDate: true, milestone: true, status: true, applicantNote: true, updatedAt: true },
          },
        },
      },
    },
  });
  if (!app) throw new NotFoundError("Application not found.");
  return app;
}

// ---------------------------------------------------------------- staff reads
export function staffScope(actor: Actor): Prisma.ApplicationWhereInput {
  if (actor.role === "ADMIN") return { status: { not: "DRAFT" } };
  if (actor.role === "REVIEWER") return { status: { not: "DRAFT" }, assignments: { some: { reviewerId: actor.id, isActive: true } } };
  throw new ForbiddenError();
}

export type StaffListParams = {
  q?: string; status?: string; opportunityId?: string; reviewerId?: string; mode?: string;
  sort?: string; dir?: "asc" | "desc"; page?: number; pageSize?: number; unassigned?: boolean;
};

export async function listApplicationsStaff(actor: Actor, p: StaffListParams = {}) {
  const scope = staffScope(actor);
  const pageSize = Math.min(p.pageSize ?? 15, 100);
  const page = Math.max(p.page ?? 1, 1);
  const and: Prisma.ApplicationWhereInput[] = [scope];
  if (p.status) and.push({ status: p.status });
  if (p.opportunityId) and.push({ opportunityId: p.opportunityId });
  if (p.mode) and.push({ applicantMode: p.mode });
  if (p.reviewerId && actor.role === "ADMIN") and.push({ assignments: { some: { reviewerId: p.reviewerId, isActive: true } } });
  if (p.unassigned && actor.role === "ADMIN") and.push({ assignments: { none: { isActive: true } } });
  if (p.q) {
    and.push({
      OR: [
        { reference: { contains: p.q } },
        { opportunity: { title: { contains: p.q } } },
        { opportunity: { reference: { contains: p.q } } },
        { applicant: { name: { contains: p.q } } },
        { organization: { name: { contains: p.q } } },
      ],
    });
  }
  const dir = p.dir === "asc" ? "asc" : "desc";
  const orderBy: Prisma.ApplicationOrderByWithRelationInput =
    p.sort === "reference" ? { reference: dir } : p.sort === "status" ? { status: dir } : p.sort === "submitted" ? { submittedAt: dir } : { updatedAt: dir };
  const where: Prisma.ApplicationWhereInput = { AND: and };
  const [rows, total] = await Promise.all([
    db.application.findMany({
      where, orderBy, skip: (page - 1) * pageSize, take: pageSize,
      select: {
        id: true, reference: true, status: true, submittedAt: true, updatedAt: true, applicantMode: true, applicantCategory: true,
        opportunity: { select: { title: true, reference: true, classification: true } },
        applicant: { select: { name: true } },
        organization: { select: { name: true } },
        assignments: { where: { isActive: true }, select: { reviewer: { select: { id: true, name: true } } } },
      },
    }),
    db.application.count({ where }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Throws unless the staff member may see this application (reviewers: assigned only). */
export async function assertStaffAccess(actor: Actor, appId: string) {
  const found = await db.application.findFirst({ where: { AND: [{ id: appId }, staffScope(actor)] }, select: { id: true } });
  if (!found) throw new NotFoundError("Application not found.");
}

export async function getApplicationStaff(actor: Actor, id: string) {
  await assertStaffAccess(actor, id);
  const app = await db.application.findUnique({
    where: { id },
    include: {
      opportunity: { include: { questions: true } },
      // Minimal applicant identity: no email, phone or password data.
      applicant: { select: { id: true, name: true, role: true, individual: { select: { fullName: true, country: true, city: true, applicantCategory: true, background: true } } } },
      organization: { select: { id: true, name: true, type: true, country: true, city: true, website: true, description: true } },
      answers: { orderBy: { questionKey: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      assignments: { orderBy: { createdAt: "asc" }, include: { reviewer: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
      decisions: { orderBy: { decidedAt: "asc" } },
      award: { include: { disbursements: { orderBy: { plannedDate: "asc" } } } },
    },
  });
  if (!app) throw new NotFoundError("Application not found.");
  const authorIds = [...new Set([...app.notes.map((n) => n.authorId), ...app.decisions.map((d) => d.decidedById), ...app.events.map((e) => e.actorId).filter((x): x is string => !!x)])];
  const authors = await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } });
  return { app, opp: toView(app.opportunity), authors: Object.fromEntries(authors.map((a) => [a.id, a.name])) };
}
