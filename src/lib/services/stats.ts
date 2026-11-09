import { db } from "../db";
import { isApplicantRole } from "../constants";
import { ForbiddenError, assertCan, type Actor } from "../permissions";
import { individualCompletion, organizationCompletion } from "../validation/profile";
import { parseList } from "../json";
import { memberOrganizationIds, staffScope } from "./applications";
import { awardTotals } from "./awards";
import { summarizeAward } from "../awards-calc";

/** Every number here is computed from the database at request time. */
export async function adminOverview(actor: Actor) {
  assertCan(actor.role, "admin:access");
  const isAdmin = actor.role === "ADMIN";
  const scope = staffScope(actor);
  const [byStatus, oppCounts, supportOpen, unassigned] = await Promise.all([
    db.application.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
    isAdmin ? db.opportunity.groupBy({ by: ["status"], _count: { _all: true } }) : Promise.resolve([]),
    isAdmin ? db.supportRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }) : Promise.resolve(0),
    isAdmin ? db.application.count({ where: { status: { in: ["SUBMITTED", "INITIAL_REVIEW", "UNDER_REVIEW"] }, assignments: { none: { isActive: true } } } }) : Promise.resolve(0),
  ]);
  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;
  const c = (...s: string[]) => s.reduce((a, k) => a + (statusMap[k] ?? 0), 0);
  const oppMap = Object.fromEntries(oppCounts.map((s) => [s.status, s._count._all])) as Record<string, number>;
  const money = isAdmin ? await awardTotals(actor) : [];
  const disb = isAdmin ? await db.disbursement.groupBy({ by: ["status", "currency"], _count: { _all: true }, _sum: { amountMinor: true } }) : [];
  return {
    isAdmin,
    totalApplications: Object.values(statusMap).reduce((a, b) => a + b, 0),
    awaitingReview: c("SUBMITTED", "INITIAL_REVIEW", "UNDER_REVIEW"),
    infoRequested: c("INFO_REQUESTED", "RESUBMISSION_REQUIRED"),
    recommended: c("RECOMMENDED"),
    approved: c("APPROVED", "AWARD_PROCESSING", "DISBURSEMENT_SCHEDULED", "PARTIALLY_DISBURSED", "FULLY_DISBURSED"),
    declined: c("DECLINED"),
    statusMap,
    opportunities: { total: Object.values(oppMap).reduce((a, b) => a + b, 0), published: oppMap.PUBLISHED ?? 0, draft: oppMap.DRAFT ?? 0, archived: oppMap.ARCHIVED ?? 0 },
    supportOpen,
    unassigned,
    money,
    scheduledDisbursements: disb.filter((d) => ["SCHEDULED", "AWAITING_PROCESSING", "PROCESSING_RECORDED"].includes(d.status)).map((d) => ({ currency: d.currency, count: d._count._all, minor: d._sum.amountMinor ?? 0 })),
    paidRecorded: disb.filter((d) => ["PAID_MANUAL", "RECONCILED"].includes(d.status)).map((d) => ({ currency: d.currency, count: d._count._all, minor: d._sum.amountMinor ?? 0 })),
  };
}

export async function applicantOverview(actor: Actor) {
  if (!isApplicantRole(actor.role)) throw new ForbiddenError();
  const orgIds = await memberOrganizationIds(actor.id);
  const ownWhere = { OR: [{ applicantUserId: actor.id }, ...(orgIds.length ? [{ organizationId: { in: orgIds } }] : [])] };
  const [apps, saved, notifications, unread, support, awards, individual, orgs] = await Promise.all([
    db.application.findMany({
      where: ownWhere, orderBy: { updatedAt: "desc" },
      select: { id: true, reference: true, status: true, submittedAt: true, decidedAt: true, updatedAt: true, currentStep: true, opportunity: { select: { title: true, slug: true, classification: true } } },
    }),
    db.savedOpportunity.findMany({ where: { userId: actor.id }, orderBy: { createdAt: "desc" }, take: 5, include: { opportunity: { select: { title: true, slug: true, classification: true, deadline: true, status: true } } } }),
    db.notification.findMany({ where: { userId: actor.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.notification.count({ where: { userId: actor.id, readAt: null } }),
    db.supportRequest.findMany({ where: { userId: actor.id }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, reference: true, topic: true, status: true } }),
    db.award.findMany({
      where: { application: ownWhere },
      select: { id: true, reference: true, amountMinor: true, currency: true, status: true, application: { select: { id: true, reference: true } }, disbursements: { orderBy: { plannedDate: "asc" }, select: { id: true, amountMinor: true, currency: true, plannedDate: true, status: true, milestone: true } } },
    }),
    actor.role === "INDIVIDUAL_APPLICANT" ? db.individualProfile.findUnique({ where: { userId: actor.id } }) : null,
    orgIds.length ? db.organizationProfile.findMany({ where: { id: { in: orgIds } } }) : [],
  ]);
  const completion = actor.role === "INDIVIDUAL_APPLICANT"
    ? individualCompletion(individual ? { ...individual, interests: parseList(individual.interests) } : null)
    : organizationCompletion(orgs[0] ? { ...orgs[0], sectors: parseList(orgs[0].sectors) } : null);
  const by = (...s: string[]) => apps.filter((a) => s.includes(a.status));
  const upcoming = awards.flatMap((a) =>
    a.disbursements.filter((d) => ["SCHEDULED", "AWAITING_PROCESSING", "PROCESSING_RECORDED"].includes(d.status)).map((d) => ({ ...d, applicationRef: a.application.reference, applicationId: a.application.id })),
  ).sort((a, b) => a.plannedDate.getTime() - b.plannedDate.getTime()).slice(0, 5);
  return {
    completion,
    drafts: by("DRAFT"),
    submitted: apps.filter((a) => a.status !== "DRAFT"),
    needsAction: by("INFO_REQUESTED", "RESUBMISSION_REQUIRED", "DRAFT"),
    underReview: by("SUBMITTED", "INITIAL_REVIEW", "UNDER_REVIEW", "RECOMMENDED"),
    decisions: by("APPROVED", "DECLINED", "AWARD_PROCESSING", "DISBURSEMENT_SCHEDULED", "PARTIALLY_DISBURSED", "FULLY_DISBURSED").slice(0, 5),
    saved, notifications, unread, support,
    awards: awards.map((a) => ({ ...a, summary: summarizeAward(a.amountMinor, a.disbursements) })),
    upcoming,
    total: apps.length,
    organizationName: orgs[0]?.name ?? null,
  };
}
