import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { ForbiddenError, NotFoundError, ValidationError, assertCan, type Actor } from "../permissions";
import { opportunitySchema, verifyLiveSchema, type OpportunityInput } from "../validation/opportunity";
import { slugify } from "../validation/common";
import { buildReference, withUniqueReference } from "../references";
import { parseAmountToMinor, isCurrency } from "../money";
import { parseFaq, parseList, toJson } from "../json";
import { applicationWindow } from "../eligibility";
import { recordAudit } from "./audit";

// ---------------------------------------------------------------- view model
export type OpportunityRow = Prisma.OpportunityGetPayload<{ include: { questions: true } }>;

export function toView(o: OpportunityRow) {
  return {
    ...o,
    applicantTypeList: parseList(o.applicantTypes),
    regionList: parseList(o.eligibleRegions),
    keywordList: parseList(o.keywords),
    criteria: parseList(o.eligibilityCriteria),
    requiredInfo: parseList(o.requiredInformation),
    requiredDocs: parseList(o.requiredDocuments),
    faqList: parseFaq(o.faq),
    isDemo: o.classification === "DEMO",
    window: applicationWindow(o),
    questions: [...o.questions]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((q) => ({ ...q, optionList: parseList(q.options) })),
  };
}
export type OpportunityView = ReturnType<typeof toView>;

// ---------------------------------------------------------------- public search
export type SearchParams = {
  q?: string;
  applicantType?: string;
  category?: string;
  region?: string;
  status?: string; // open | upcoming | closed
  deadline?: string; // 7 | 30 | 90 | none
  currency?: string;
  minFunding?: string; // major units, in `currency`
  sort?: string; // newest | deadline | funding | title
  page?: number;
  pageSize?: number;
};

export const SORTS = ["newest", "deadline", "funding", "title"] as const;

export async function searchOpportunities(p: SearchParams, now = new Date()) {
  const pageSize = Math.min(Math.max(p.pageSize ?? 9, 1), 50);
  const page = Math.max(p.page ?? 1, 1);
  const and: Prisma.OpportunityWhereInput[] = [{ status: "PUBLISHED" }];

  const q = p.q?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q } },
        { shortDescription: { contains: q } },
        { description: { contains: q } },
        { keywords: { contains: q } },
        { reference: { contains: q } },
      ],
    });
  }
  if (p.applicantType) and.push({ applicantTypes: { contains: `"${p.applicantType}"` } });
  if (p.category) and.push({ category: p.category });
  if (p.region) and.push({ eligibleRegions: { contains: JSON.stringify(p.region) } });

  if (p.status === "open") {
    and.push({ OR: [{ opensAt: null }, { opensAt: { lte: now } }] });
    and.push({ OR: [{ deadline: null }, { deadline: { gte: now } }] });
  } else if (p.status === "upcoming") {
    and.push({ opensAt: { gt: now } });
  } else if (p.status === "closed") {
    and.push({ deadline: { lt: now } });
  }

  if (p.deadline === "none") {
    and.push({ deadline: null });
  } else if (p.deadline && ["7", "30", "90"].includes(p.deadline)) {
    const until = new Date(now.getTime() + Number(p.deadline) * 86_400_000);
    and.push({ deadline: { gte: now, lte: until } });
  }

  if (p.minFunding && p.currency && isCurrency(p.currency)) {
    const minor = parseAmountToMinor(p.minFunding, p.currency);
    if (minor !== null) {
      and.push({
        fundingSpecified: true,
        currency: p.currency,
        OR: [{ fixedAmountMinor: { gte: minor } }, { maxAmountMinor: { gte: minor } }],
      });
    }
  }

  const orderBy: Prisma.OpportunityOrderByWithRelationInput[] =
    p.sort === "deadline"
      ? [{ deadline: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }]
      : p.sort === "funding"
        ? [{ maxAmountMinor: { sort: "desc", nulls: "last" } }, { fixedAmountMinor: { sort: "desc", nulls: "last" } }]
        : p.sort === "title"
          ? [{ title: "asc" }]
          : [{ createdAt: "desc" }];

  const where: Prisma.OpportunityWhereInput = { AND: and };
  const [rows, total] = await Promise.all([
    db.opportunity.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { questions: true } }),
    db.opportunity.count({ where }),
  ]);
  return { items: rows.map(toView), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPublishedBySlug(slug: string) {
  const row = await db.opportunity.findFirst({ where: { slug, status: "PUBLISHED" }, include: { questions: true } });
  return row ? toView(row) : null;
}

export async function featuredOpportunities(take = 3) {
  const rows = await db.opportunity.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { questions: true },
  });
  const now = new Date();
  const open = rows.filter((r) => applicationWindow(r, now).open).slice(0, take);
  return open.map(toView);
}

export async function relatedOpportunities(opp: { id: string; category: string }, take = 3) {
  const rows = await db.opportunity.findMany({
    where: { status: "PUBLISHED", category: opp.category, id: { not: opp.id } },
    orderBy: { createdAt: "desc" },
    take,
    include: { questions: true },
  });
  return rows.map(toView);
}

export async function publicFacets() {
  const rows = await db.opportunity.findMany({ where: { status: "PUBLISHED" }, select: { category: true, eligibleRegions: true } });
  const categories = [...new Set(rows.map((r) => r.category))].sort();
  const regions = [...new Set(rows.flatMap((r) => parseList(r.eligibleRegions)))].sort();
  return { categories, regions };
}

// ---------------------------------------------------------------- live readiness
export type ReadinessItem = { key: string; label: string; done: boolean };

/**
 * What must exist before an opportunity may be treated as a REAL (LIVE) programme.
 * DEMO opportunities are never "ready": they stay fictional.
 */
export function getLiveReadiness(o: OpportunityView | OpportunityRow): ReadinessItem[] {
  const v = "applicantTypeList" in o ? o : toView(o as OpportunityRow);
  const items: ReadinessItem[] = [
    { key: "funder", label: "Funding organization named and verified", done: !!v.funderName && v.funderVerified },
    { key: "terms", label: "Programme terms written and approved", done: !!v.programmeTerms && v.termsApproved },
    { key: "eligibility", label: "Eligibility criteria listed", done: v.criteria.length > 0 },
    { key: "applicants", label: "Accepted applicant types selected", done: v.applicantTypeList.length > 0 },
    { key: "regions", label: "Eligible regions confirmed", done: v.regionList.length > 0 },
    { key: "dates", label: "Opening date and deadline confirmed", done: !!v.opensAt && !!v.deadline },
    { key: "selection", label: "Selection and review process described", done: !!v.selectionProcess },
    { key: "timeline", label: "Expected decision timeline confirmed", done: !!v.decisionTimeline },
    {
      key: "funding",
      label: "Award amount, currency and disbursement structure confirmed",
      done: v.fundingSpecified
        ? !!v.currency && (v.fixedAmountMinor != null || v.maxAmountMinor != null) && !!v.awardType && !!v.paymentSchedule
        : !!v.awardType,
    },
    { key: "fee", label: "Fee statement reviewed (fees are disabled by default)", done: v.feePolicyStatus === "NONE" },
  ];
  return items;
}

/** Fields whose change invalidates a prior verification of a LIVE opportunity. */
const MATERIAL_FIELDS = [
  "title", "description", "applicantTypes", "eligibleRegions", "fundingSpecified", "currency", "minAmountMinor", "maxAmountMinor",
  "fixedAmountMinor", "awardType", "fundingTerms", "plannedInstallments", "installmentPlan", "paymentSchedule", "disbursementConditions",
  "eligibilityCriteria", "opensAt", "deadline", "programmeTerms", "funderName", "selectionProcess", "decisionTimeline",
] as const;

export function materialFingerprint(row: Record<string, unknown>): string {
  const subset = Object.fromEntries(MATERIAL_FIELDS.map((k) => [k, row[k] instanceof Date ? (row[k] as Date).toISOString() : row[k] ?? null]));
  return createHash("sha256").update(JSON.stringify(subset)).digest("hex");
}

// ---------------------------------------------------------------- admin
export async function listOpportunitiesAdmin(f: { q?: string; status?: string; classification?: string; page?: number; pageSize?: number } = {}) {
  const pageSize = f.pageSize ?? 20;
  const page = Math.max(f.page ?? 1, 1);
  const where: Prisma.OpportunityWhereInput = {
    ...(f.status ? { status: f.status } : {}),
    ...(f.classification ? { classification: f.classification } : {}),
    ...(f.q ? { OR: [{ title: { contains: f.q } }, { reference: { contains: f.q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.opportunity.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { questions: true, _count: { select: { applications: true } } },
    }),
    db.opportunity.count({ where }),
  ]);
  return { rows: rows.map((r) => ({ ...toView(r), applicationCount: r._count.applications })), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getOpportunityAdmin(id: string) {
  const row = await db.opportunity.findUnique({ where: { id }, include: { questions: true } });
  return row ? toView(row) : null;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || "opportunity";
  for (let i = 2; i < 50; i++) {
    const clash = await db.opportunity.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
  throw new ValidationError("Could not generate a unique slug; please enter one manually.");
}

function toColumns(v: OpportunityInput) {
  const minor = (t?: string) => (t ? parseAmountToMinor(t, v.currency) : null);
  const funded = v.fundingSpecified;
  return {
    title: v.title,
    shortDescription: v.shortDescription,
    description: v.description,
    category: v.category,
    applicantTypes: toJson(v.applicantTypes),
    eligibleRegions: toJson(v.eligibleRegions),
    keywords: toJson(v.keywords),
    fundingSpecified: funded,
    currency: v.currency,
    minAmountMinor: funded ? minor(v.minAmount) : null,
    maxAmountMinor: funded ? minor(v.maxAmount) : null,
    fixedAmountMinor: funded ? minor(v.fixedAmount) : null,
    awardType: v.awardType ?? null,
    fundingPurpose: v.fundingPurpose ?? null,
    fundingTerms: v.fundingTerms ?? null,
    plannedInstallments: typeof v.plannedInstallments === "number" ? v.plannedInstallments : null,
    installmentPlan: v.installmentPlan ?? null,
    milestones: v.milestones ?? null,
    paymentSchedule: v.paymentSchedule ?? null,
    disbursementConditions: v.disbursementConditions ?? null,
    feePolicyNote: v.feePolicyNote ?? null,
    eligibilityCriteria: toJson(v.eligibilityCriteria),
    requiredInformation: toJson(v.requiredInformation),
    requiredDocuments: toJson(v.requiredDocuments),
    opensAt: v.opensAt ?? null,
    deadline: v.deadline ?? null,
    selectionProcess: v.selectionProcess ?? null,
    decisionTimeline: v.decisionTimeline ?? null,
    programmeTerms: v.programmeTerms ?? null,
    termsApproved: v.termsApproved,
    funderName: v.funderName ?? null,
    funderVerified: v.funderVerified,
    faq: toJson(v.faq),
    allowMultipleApplications: v.allowMultipleApplications,
    requireProposal: v.questions.some((q) => q.section === "PROJECT"),
  };
}

/** Create (id = null) or update an opportunity. `classification` is only settable at creation. */
export async function saveOpportunity(actor: Actor, id: string | null, raw: unknown, classification: "DEMO" | "LIVE" = "DEMO") {
  assertCan(actor.role, "opportunity:manage");
  const input = opportunitySchema.parse(raw);
  const cols = toColumns(input);
  const slug = await uniqueSlug(input.slug ?? slugify(input.title), id ?? undefined);

  return db.$transaction(async (tx) => {
    if (!id) {
      const created = await withUniqueReference(
        () => buildReference("OPP", classification === "DEMO"),
        (reference) =>
          tx.opportunity.create({
            data: { ...cols, slug, reference, classification, status: "DRAFT", createdById: actor.id },
          }),
      );
      await tx.opportunityQuestion.createMany({
        data: input.questions.map((q, i) => ({
          opportunityId: created.id, key: q.key, label: q.label, helpText: q.helpText ?? null, type: q.type,
          options: toJson(q.options), required: q.required, section: q.section, sortOrder: i,
        })),
      });
      await recordAudit({ actor, action: "opportunity.created", entityType: "Opportunity", entityId: created.id, summary: `Created ${classification} opportunity "${created.title}" (${created.reference})` }, tx);
      return { id: created.id, slug: created.slug, unpublished: false };
    }

    const before = await tx.opportunity.findUnique({ where: { id } });
    if (!before) throw new NotFoundError("Opportunity not found.");
    let status = before.status;
    let verifiedAt = before.verifiedAt;
    let verifiedById = before.verifiedById;
    let unpublished = false;
    const next = { ...cols, slug };
    // Editing material facts of a verified LIVE programme voids its verification.
    if (before.classification === "LIVE" && before.verifiedAt && materialFingerprint(before) !== materialFingerprint(next as unknown as Record<string, unknown>)) {
      verifiedAt = null;
      verifiedById = null;
      if (status === "PUBLISHED") {
        status = "DRAFT";
        unpublished = true;
      }
    }
    const updated = await tx.opportunity.update({ where: { id }, data: { ...next, status, verifiedAt, verifiedById } });
    await tx.opportunityQuestion.deleteMany({ where: { opportunityId: id } });
    await tx.opportunityQuestion.createMany({
      data: input.questions.map((q, i) => ({
        opportunityId: id, key: q.key, label: q.label, helpText: q.helpText ?? null, type: q.type,
        options: toJson(q.options), required: q.required, section: q.section, sortOrder: i,
      })),
    });

    const fundingKeys = ["fundingSpecified", "currency", "minAmountMinor", "maxAmountMinor", "fixedAmountMinor", "awardType", "fundingTerms", "plannedInstallments", "installmentPlan", "paymentSchedule", "disbursementConditions"] as const;
    const eligKeys = ["applicantTypes", "eligibleRegions", "eligibilityCriteria", "opensAt", "deadline"] as const;
    const pick = (o: Record<string, unknown>, keys: readonly string[]) => Object.fromEntries(keys.map((k) => [k, o[k] ?? null]));
    const changed = (keys: readonly string[]) => JSON.stringify(pick(before, keys)) !== JSON.stringify(pick(updated, keys));
    await recordAudit({ actor, action: "opportunity.updated", entityType: "Opportunity", entityId: id, summary: `Updated opportunity "${updated.title}" (${updated.reference})${unpublished ? " — verification voided and unpublished" : ""}` }, tx);
    if (changed(fundingKeys)) await recordAudit({ actor, action: "opportunity.funding_config_changed", entityType: "Opportunity", entityId: id, summary: `Funding configuration changed on ${updated.reference}`, before: pick(before, fundingKeys), after: pick(updated, fundingKeys) }, tx);
    if (changed(eligKeys)) await recordAudit({ actor, action: "opportunity.eligibility_changed", entityType: "Opportunity", entityId: id, summary: `Eligibility/dates changed on ${updated.reference}`, before: pick(before, eligKeys), after: pick(updated, eligKeys) }, tx);
    return { id, slug: updated.slug, unpublished };
  });
}

export type PublishBlock = { ok: false; message: string; missing: string[] } | { ok: true };

/** Publication rules. DEMO: always publishable. LIVE: must be explicitly verified and fully ready. */
export function canPublish(o: OpportunityView): PublishBlock {
  if (o.applicantTypeList.length === 0) {
    return { ok: false, message: "Select at least one accepted applicant type before publishing.", missing: ["Accepted applicant types"] };
  }
  if (o.isDemo) return { ok: true };
  const missing = getLiveReadiness(o).filter((i) => !i.done).map((i) => i.label);
  if (!o.verifiedAt) missing.unshift("Explicit verification confirmation (who verified, and when)");
  if (missing.length) return { ok: false, message: "A LIVE opportunity cannot be published until every verification item is complete.", missing };
  return { ok: true };
}

export async function setOpportunityStatus(actor: Actor, id: string, to: "PUBLISHED" | "DRAFT" | "ARCHIVED") {
  assertCan(actor.role, "opportunity:manage");
  const row = await db.opportunity.findUnique({ where: { id }, include: { questions: true } });
  if (!row) throw new NotFoundError("Opportunity not found.");
  const view = toView(row);
  if (to === "PUBLISHED") {
    const gate = canPublish(view);
    if (!gate.ok) throw new ValidationError(`${gate.message} Missing: ${gate.missing.join("; ")}.`);
  }
  if (row.status === to) return;
  await db.$transaction(async (tx) => {
    await tx.opportunity.update({ where: { id }, data: { status: to, archivedAt: to === "ARCHIVED" ? new Date() : null } });
    await recordAudit({ actor, action: `opportunity.${to === "PUBLISHED" ? "published" : to === "ARCHIVED" ? "archived" : "unpublished"}`, entityType: "Opportunity", entityId: id, summary: `${row.reference} status ${row.status} → ${to}`, before: { status: row.status }, after: { status: to } }, tx);
  });
}

/**
 * Explicitly mark an opportunity as a verified LIVE programme. This is the ONLY path from
 * DEMO to LIVE; a normal edit can never do it. Records who verified and when.
 */
export async function verifyAndMarkLive(actor: Actor, id: string, raw: unknown) {
  assertCan(actor.role, "opportunity:verify");
  const input = verifyLiveSchema.parse(raw);
  const row = await db.opportunity.findUnique({ where: { id }, include: { questions: true } });
  if (!row) throw new NotFoundError("Opportunity not found.");
  const missing = getLiveReadiness(row).filter((i) => !i.done);
  if (missing.length) throw new ValidationError(`Cannot verify yet. Still to confirm: ${missing.map((m) => m.label).join("; ")}.`);
  await db.$transaction(async (tx) => {
    await tx.opportunity.update({
      where: { id },
      data: { classification: "LIVE", verifiedAt: new Date(), verifiedById: actor.id, verificationNote: input.note },
    });
    await recordAudit({ actor, action: "opportunity.verified_live", entityType: "Opportunity", entityId: id, summary: `${row.reference} verified and classified LIVE`, before: { classification: row.classification, verifiedAt: row.verifiedAt }, after: { classification: "LIVE" }, reason: input.note }, tx);
  });
}

// ---------------------------------------------------------------- saved
export async function toggleSaved(userId: string, opportunityId: string): Promise<boolean> {
  const opp = await db.opportunity.findFirst({ where: { id: opportunityId, status: "PUBLISHED" }, select: { id: true } });
  if (!opp) throw new NotFoundError("Opportunity not found.");
  const existing = await db.savedOpportunity.findUnique({ where: { userId_opportunityId: { userId, opportunityId } } });
  if (existing) {
    await db.savedOpportunity.delete({ where: { id: existing.id } });
    return false;
  }
  await db.savedOpportunity.create({ data: { userId, opportunityId } });
  return true;
}

export async function listSaved(userId: string) {
  const rows = await db.savedOpportunity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { opportunity: { include: { questions: true } } },
  });
  return rows.map((r) => toView(r.opportunity));
}

export async function isSaved(userId: string, opportunityId: string) {
  return !!(await db.savedOpportunity.findUnique({ where: { userId_opportunityId: { userId, opportunityId } }, select: { id: true } }));
}

export { ForbiddenError };
