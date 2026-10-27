import { db } from "../db";
import { assertCan, ValidationError, type Actor } from "../permissions";
import { csvFilename, toCsv } from "../csv";
import { DISBURSEMENT_LABELS, STATUS_LABELS, type ApplicationStatus, type DisbursementStatus } from "../constants";
import { minorToInputValue } from "../money";
import { recordAudit } from "./audit";

export const EXPORT_TYPES = ["opportunities", "applications", "awards", "disbursements", "support"] as const;
export type ExportType = (typeof EXPORT_TYPES)[number];
export const EXPORT_LABELS: Record<ExportType, { title: string; description: string }> = {
  opportunities: { title: "Opportunity list", description: "Reference, title, status, classification, dates and funding configuration." },
  applications: { title: "Application tracking report", description: "Reference, opportunity, applicant display name, status and dates. No contact details or internal notes." },
  awards: { title: "Award records", description: "Award reference, amount, currency, status and scheduled/recorded totals. Internal notes excluded." },
  disbursements: { title: "Disbursement schedule", description: "Instalments with planned dates and manually recorded statuses. Internal notes excluded." },
  support: { title: "Support queue", description: "Reference, topic, status and dates. Message bodies and internal notes excluded." },
};

const d = (v: Date | null | undefined) => (v ? v.toISOString().slice(0, 10) : "");

/**
 * Builds a CSV for an authorised administrator and records the export in the audit log.
 * Never includes passwords, sessions, internal notes, email addresses or message bodies.
 */
export async function runExport(actor: Actor, type: string): Promise<{ filename: string; csv: string; rows: number }> {
  assertCan(actor.role, "export:run");
  if (!(EXPORT_TYPES as readonly string[]).includes(type)) throw new ValidationError("Unknown export type.");
  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (type === "opportunities") {
    const items = await db.opportunity.findMany({ orderBy: { createdAt: "asc" } });
    headers = ["Reference", "Title", "Status", "Classification", "Category", "Opens", "Deadline", "Funding specified", "Currency", "Min amount", "Max amount", "Fixed amount", "Verified at"];
    rows = items.map((o) => [o.reference, o.title, o.status, o.classification, o.category, d(o.opensAt), d(o.deadline), o.fundingSpecified ? "Yes" : "No", o.currency, o.minAmountMinor == null ? "" : minorToInputValue(o.minAmountMinor, o.currency), o.maxAmountMinor == null ? "" : minorToInputValue(o.maxAmountMinor, o.currency), o.fixedAmountMinor == null ? "" : minorToInputValue(o.fixedAmountMinor, o.currency), d(o.verifiedAt)]);
  } else if (type === "applications") {
    const items = await db.application.findMany({
      where: { status: { not: "DRAFT" } }, orderBy: { submittedAt: "asc" },
      include: { opportunity: { select: { reference: true, title: true, classification: true } }, applicant: { select: { name: true } }, organization: { select: { name: true } }, assignments: { where: { isActive: true }, include: { reviewer: { select: { name: true } } } } },
    });
    headers = ["Application reference", "Opportunity reference", "Opportunity", "Demo/Live", "Applicant type", "Applicant name", "Status", "Submitted", "Decided", "Assigned reviewer"];
    rows = items.map((a) => [a.reference, a.opportunity.reference, a.opportunity.title, a.opportunity.classification, a.applicantCategory, a.organization?.name ?? a.applicant.name, STATUS_LABELS[a.status as ApplicationStatus] ?? a.status, d(a.submittedAt), d(a.decidedAt), a.assignments[0]?.reviewer.name ?? ""]);
  } else if (type === "awards") {
    const items = await db.award.findMany({ orderBy: { createdAt: "asc" }, include: { disbursements: true, application: { select: { reference: true } } } });
    const { summarizeAward } = await import("../awards-calc");
    headers = ["Award reference", "Application reference", "Currency", "Approved amount", "Scheduled amount", "Recorded as paid (manual, unverified)", "Unscheduled balance", "Award status", "Acceptance", "Approved on"];
    rows = items.map((a) => { const s = summarizeAward(a.amountMinor, a.disbursements); const f = (m: number) => minorToInputValue(m, a.currency); return [a.reference, a.application.reference, a.currency, f(a.amountMinor), f(s.scheduledMinor), f(s.paidRecordedMinor), f(s.unscheduledMinor), a.status, a.acceptanceStatus, d(a.approvedAt)]; });
  } else if (type === "disbursements") {
    const items = await db.disbursement.findMany({ orderBy: { plannedDate: "asc" }, include: { award: { select: { reference: true, application: { select: { reference: true } } } } } });
    headers = ["Instalment reference", "Award reference", "Application reference", "Currency", "Amount", "Planned date", "Milestone", "Status (manual record)", "Last updated"];
    rows = items.map((x) => [x.reference, x.award.reference, x.award.application.reference, x.currency, minorToInputValue(x.amountMinor, x.currency), d(x.plannedDate), x.milestone ?? "", DISBURSEMENT_LABELS[x.status as DisbursementStatus] ?? x.status, d(x.updatedAt)]);
  } else {
    const items = await db.supportRequest.findMany({ orderBy: { createdAt: "asc" } });
    headers = ["Reference", "Topic", "Related reference", "Status", "Received", "Last updated"];
    rows = items.map((s) => [s.reference, s.topic, s.relatedRef ?? "", s.status, d(s.createdAt), d(s.updatedAt)]);
  }

  const csv = toCsv(headers, rows);
  const filename = csvFilename(type);
  await recordAudit({ actor, action: "export.csv", entityType: "Export", entityId: type, summary: `Exported ${type} CSV (${rows.length} rows) as ${filename}` });
  return { filename, csv, rows: rows.length };
}
