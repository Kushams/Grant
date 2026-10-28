import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getApplicantApplicationDetail, startOrResumeApplication, saveApplicationStep, submitApplication } from "@/lib/services/applications";
import { assignReviewer, decide, moveStatus, recommend } from "@/lib/services/review";
import { approvedWithoutAward, awardTotals, changeAwardAmount, changeDisbursementStatus, createAward, createDisbursement, getAwardAdmin, listApplicantAwards, listAwards, updateDisbursement } from "@/lib/services/awards";
import { runExport } from "@/lib/services/exports";
import { ForbiddenError } from "@/lib/permissions";
import { makeApplicant, makePublishedOpportunity, makeStaff } from "../helpers";

const consent = { consentAccepted: true, consentTerms: true };

async function approvedApplication(over: Record<string, unknown> = {}) {
  const admin = await makeStaff("ADMIN");
  const reviewer = await makeStaff("REVIEWER");
  const opp = await makePublishedOpportunity(admin, over);
  const me = await makeApplicant();
  const { id } = await startOrResumeApplication(me, opp.slug);
  await saveApplicationStep(me, id, 3, 4, { answers: { story: "story" } });
  await saveApplicationStep(me, id, 4, 5, { answers: { purpose: "purpose" }, requestedAmount: "2000.00" });
  await submitApplication(me, id, consent);
  await assignReviewer(admin, id, { reviewerId: reviewer.id });
  await moveStatus(reviewer, id, { to: "INITIAL_REVIEW" });
  await moveStatus(reviewer, id, { to: "UNDER_REVIEW" });
  await recommend(reviewer, id, { recommendation: "APPROVE", body: "Recommend approval." });
  await decide(admin, id, { outcome: "APPROVE", reason: "Approved in test.", applicantMessage: "Approved (demo)." });
  return { admin, reviewer, me, id, opp };
}
const award = (id: string, over: Record<string, unknown> = {}) => ({ applicationId: id, amount: "3000.00", currency: "USD", acceptanceStatus: "PENDING", conditions: "Fictional conditions", applicantSummary: "Fictional award summary.", internalNotes: "INTERNAL award note", ...over });

describe("awards", () => {
  it("only administrators may create awards, and only for finally-approved applications", async () => {
    const { admin, reviewer, me, id } = await approvedApplication();
    await expect(createAward(reviewer, award(id))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createAward(me, award(id))).rejects.toBeInstanceOf(ForbiddenError);
    const created = await createAward(admin, award(id));
    expect(created.reference).toMatch(/^NEN-AWD-DEMO-\d{4}-/);
    expect(created.amountMinor).toBe(300000);
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("AWARD_PROCESSING");
    await expect(createAward(admin, award(id))).rejects.toThrow(/already has an award/);

    // An application that was never approved cannot receive one.
    const other = await makeApplicant();
    const opp2 = await makePublishedOpportunity(admin);
    const d = await startOrResumeApplication(other, opp2.slug);
    await expect(createAward(admin, award(d.id))).rejects.toThrow(/final approval/);
  });

  it("validates amount against programme limits and the controlled currency list", async () => {
    const { admin, id } = await approvedApplication();
    await expect(createAward(admin, award(id, { amount: "6000.00" }))).rejects.toThrow(/above/);
    await expect(createAward(admin, award(id, { amount: "500.00" }))).rejects.toThrow(/below/);
    await expect(createAward(admin, award(id, { amount: "1.234" }))).rejects.toThrow();
    await expect(createAward(admin, award(id, { amount: "-5" }))).rejects.toThrow();
    await expect(createAward(admin, award(id, { currency: "BTC" }))).rejects.toThrow();
    const ok = await createAward(admin, award(id, { currency: "GBP", amount: "2500.50" })); // other currency: programme USD limits don't apply
    expect(ok.currency).toBe("GBP");
    expect(ok.amountMinor).toBe(250050);
  });

  it("schedules instalments, rejects over-allocation, shows the remaining balance and syncs application status", async () => {
    const { admin, id } = await approvedApplication();
    const a = await createAward(admin, award(id));
    const d1 = await createDisbursement(admin, { awardId: a.id, amount: "1000.00", plannedDate: "2999-03-01", milestone: "Kick-off", applicantNote: "First instalment (planned)." });
    expect(d1.status).toBe("SCHEDULED");
    expect(d1.currency).toBe("USD");
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("DISBURSEMENT_SCHEDULED");
    await expect(createDisbursement(admin, { awardId: a.id, amount: "2000.01", plannedDate: "2999-04-01" })).rejects.toThrow(/exceed.*remaining unscheduled balance: USD 2,000.00/i);
    const d2 = await createDisbursement(admin, { awardId: a.id, amount: "2000.00", plannedDate: "2999-04-01" });
    const full = await getAwardAdmin(admin, a.id);
    expect(full.summary.unscheduledMinor).toBe(0);
    expect(full.summary.fullyScheduled).toBe(true);
    // Cancelling frees balance for re-planning.
    await changeDisbursementStatus(admin, d2.id, { to: "CANCELLED", reason: "Replanning the schedule" });
    expect((await getAwardAdmin(admin, a.id)).summary.unscheduledMinor).toBe(200000);
    await createDisbursement(admin, { awardId: a.id, amount: "2000.00", plannedDate: "2999-05-01" });
  });

  it("requires a manual-record acknowledgement and reason for paid statuses, with legal transitions only", async () => {
    const { admin, id } = await approvedApplication();
    const a = await createAward(admin, award(id));
    const d = await createDisbursement(admin, { awardId: a.id, amount: "1000.00", plannedDate: "2999-03-01" });
    await expect(changeDisbursementStatus(admin, d.id, { to: "PAID_MANUAL", reason: "Bank ref 123", acknowledgeManual: true })).rejects.toThrow(/cannot move/); // must go via processing
    await changeDisbursementStatus(admin, d.id, { to: "AWAITING_PROCESSING", reason: "Sent to finance team" });
    await expect(changeDisbursementStatus(admin, d.id, { to: "PAID_MANUAL", reason: "Bank ref 123" })).rejects.toThrow(/manually recording/);
    await changeDisbursementStatus(admin, d.id, { to: "PAID_MANUAL", reason: "Finance ref FIN-123 (entered manually)", acknowledgeManual: true });
    const row = await db.disbursement.findUniqueOrThrow({ where: { id: d.id } });
    expect(row.status).toBe("PAID_MANUAL");
    expect(row.manualRecordNote).toContain("FIN-123");
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("PARTIALLY_DISBURSED");
    // Locked after payment is recorded.
    await expect(updateDisbursement(admin, d.id, { amount: "900.00", plannedDate: "2999-03-01", reason: "trying to change" })).rejects.toThrow(/can no longer be edited/);
    await expect(changeDisbursementStatus(admin, d.id, { to: "SCHEDULED", reason: "back to start please" })).rejects.toThrow(/cannot move/);
  });

  it("moves the application to Fully disbursed only when recorded payments equal the award", async () => {
    const { admin, id } = await approvedApplication();
    const a = await createAward(admin, award(id, { amount: "2000.00" }));
    const d1 = await createDisbursement(admin, { awardId: a.id, amount: "1000.00", plannedDate: "2999-03-01" });
    const d2 = await createDisbursement(admin, { awardId: a.id, amount: "1000.00", plannedDate: "2999-04-01" });
    for (const d of [d1, d2]) {
      await changeDisbursementStatus(admin, d.id, { to: "AWAITING_PROCESSING", reason: "queued with finance" });
      await changeDisbursementStatus(admin, d.id, { to: "PAID_MANUAL", reason: "manually entered ref", acknowledgeManual: true });
    }
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("FULLY_DISBURSED");
    const totals = await awardTotals(admin);
    expect(totals.find((t) => t.currency === "USD")?.paid).toBeGreaterThanOrEqual(200000);
  });

  it("keeps a full, append-only history of every disbursement change (previous value, actor, reason)", async () => {
    const { admin, id } = await approvedApplication();
    const a = await createAward(admin, award(id));
    const d = await createDisbursement(admin, { awardId: a.id, amount: "1000.00", plannedDate: "2999-03-01" });
    await updateDisbursement(admin, d.id, { amount: "1100.00", plannedDate: "2999-03-15", reason: "Date moved at request of partner" });
    await changeDisbursementStatus(admin, d.id, { to: "ON_HOLD", reason: "Awaiting signed acceptance" });
    const events = await db.disbursementEvent.findMany({ where: { disbursementId: d.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => e.toStatus)).toEqual(["SCHEDULED", "SCHEDULED", "ON_HOLD"]);
    const logs = await db.auditLog.findMany({ where: { entityId: d.id }, orderBy: { createdAt: "asc" } });
    const upd = logs.find((l) => l.action === "disbursement.updated")!;
    expect(JSON.parse(upd.before!).amountMinor).toBe(100000);
    expect(JSON.parse(upd.after!).amountMinor).toBe(110000);
    expect(upd.actorId).toBe(admin.id);
    expect(upd.reason).toContain("partner");
    await expect(db.disbursementEvent.deleteMany({ where: { disbursementId: d.id } })).rejects.toThrow();
    await expect(db.disbursementEvent.updateMany({ where: { disbursementId: d.id }, data: { reason: "tampered" } })).rejects.toThrow();
    expect(await db.disbursementEvent.count({ where: { disbursementId: d.id } })).toBe(3);
  });

  it("changing the award amount cannot go below what is scheduled and is audited", async () => {
    const { admin, id } = await approvedApplication();
    const a = await createAward(admin, award(id));
    await createDisbursement(admin, { awardId: a.id, amount: "2000.00", plannedDate: "2999-03-01" });
    await expect(changeAwardAmount(admin, a.id, { amount: "1500.00", reason: "Reducing the amount" })).rejects.toThrow(/below/);
    await changeAwardAmount(admin, a.id, { amount: "3500.00", reason: "Increase agreed by panel" });
    const log = await db.auditLog.findFirstOrThrow({ where: { entityId: a.id, action: "award.amount_changed" } });
    expect(JSON.parse(log.before!).amountMinor).toBe(300000);
    expect(JSON.parse(log.after!).amountMinor).toBe(350000);
  });

  it("applicants see only their own award, with applicant-safe fields", async () => {
    const { admin, me, id } = await approvedApplication();
    const a = await createAward(admin, award(id));
    await createDisbursement(admin, { awardId: a.id, amount: "1000.00", plannedDate: "2999-03-01", applicantNote: "Public note", internalNotes: "INTERNAL disbursement note" });
    const stranger = await makeApplicant();
    expect(await listApplicantAwards(stranger)).toHaveLength(0);
    const mine = await listApplicantAwards(me);
    expect(mine).toHaveLength(1);
    const dump = JSON.stringify([mine, await getApplicantApplicationDetail(me, id)]);
    expect(dump).toContain("Public note");
    expect(dump).toContain("Fictional award summary.");
    expect(dump).not.toContain("INTERNAL");
    expect(dump).not.toContain("manualRecordNote");
    expect(dump).not.toContain("internalNotes");
    await expect(listAwards(me)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getAwardAdmin(me, a.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createDisbursement(me, { awardId: a.id, amount: "1.00", plannedDate: "2999-03-01" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(changeDisbursementStatus(me, "x", { to: "PAID_MANUAL", reason: "i paid myself", acknowledgeManual: true })).rejects.toBeInstanceOf(ForbiddenError);
    const reviewer = await makeStaff("REVIEWER");
    await expect(listAwards(reviewer)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createDisbursement(reviewer, { awardId: a.id, amount: "1.00", plannedDate: "2999-03-01" })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lists, searches and filters awards; exposes approved-but-unawarded applications", async () => {
    const { admin, id } = await approvedApplication();
    expect((await approvedWithoutAward(admin)).map((x) => x.id)).toContain(id);
    const a = await createAward(admin, award(id));
    expect((await approvedWithoutAward(admin)).map((x) => x.id)).not.toContain(id);
    expect((await listAwards(admin, { q: a.reference })).rows).toHaveLength(1);
    expect((await listAwards(admin, { q: "NO-SUCH-REF" })).rows).toHaveLength(0);
    expect((await listAwards(admin, { awardStatus: "ON_HOLD", q: a.reference })).rows).toHaveLength(0);
    expect((await listAwards(admin, { mode: "INDIVIDUAL", q: a.reference })).rows).toHaveLength(1);
  });

  it("exports are admin-only, audited, exclude internal notes and are formula-safe", async () => {
    const { admin, reviewer, id } = await approvedApplication();
    const a = await createAward(admin, award(id, { internalNotes: "=HYPERLINK(evil)" }));
    await createDisbursement(admin, { awardId: a.id, amount: "1000.00", plannedDate: "2999-03-01", internalNotes: "INTERNAL-ONLY" });
    await expect(runExport(reviewer, "awards")).rejects.toBeInstanceOf(ForbiddenError);
    for (const type of ["opportunities", "applications", "awards", "disbursements", "support"]) {
      const out = await runExport(admin, type);
      expect(out.filename).toMatch(/^nen-[a-z-]+-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(out.csv).not.toMatch(/INTERNAL|HYPERLINK|passwordHash|tokenHash/i);
      expect(out.csv).not.toContain("@example.test");
    }
    await expect(runExport(admin, "users")).rejects.toThrow(/Unknown export/);
    expect(await db.auditLog.count({ where: { action: "export.csv", actorId: admin.id } })).toBe(5);
  });
});
