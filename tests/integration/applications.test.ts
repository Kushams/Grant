import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  getApplicantApplicationDetail, getApplicationForEdit, listApplicantApplications, respondToInfoRequest, saveApplicationStep, startOrResumeApplication,
  submitApplication, withdrawApplication, getApplicationStaff,
} from "@/lib/services/applications";
import { assignReviewer, addReviewNote, moveStatus, requestInformation, requestRevision, recommend, decide } from "@/lib/services/review";
import { setOpportunityStatus } from "@/lib/services/opportunities";
import { ForbiddenError, NotFoundError } from "@/lib/permissions";
import { makeApplicant, makePublishedOpportunity, makeStaff } from "../helpers";

const consent = { consentAccepted: true, consentTerms: true };

async function filledDraft(applicant: Awaited<ReturnType<typeof makeApplicant>>, slug: string) {
  const { id } = await startOrResumeApplication(applicant, slug);
  await saveApplicationStep(applicant, id, 1, 2, { applicantCategory: "INDIVIDUAL" });
  await saveApplicationStep(applicant, id, 3, 4, { answers: { story: "My fictional story.", size: "2-5" } });
  await saveApplicationStep(applicant, id, 4, 5, { answers: { purpose: "A fictional purpose." }, requestedAmount: "2,500.00" });
  return id;
}

describe("application workflow", () => {
  it("creates a draft, saves steps, resumes at the last step, and shows no reference until submission", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const me = await makeApplicant();
    const { id, created } = await startOrResumeApplication(me, opp.slug);
    expect(created).toBe(true);
    await saveApplicationStep(me, id, 1, 3, { applicantCategory: "INDIVIDUAL" });
    await saveApplicationStep(me, id, 3, 4, { answers: { story: "Hello" } });
    const again = await startOrResumeApplication(me, opp.slug);
    expect(again).toEqual({ id, created: false });
    const edit = await getApplicationForEdit(me, id);
    expect(edit.app.currentStep).toBe(4);
    expect(edit.answers.story).toBe("Hello");
    expect(edit.app.reference).toBeNull();
    expect(edit.app.status).toBe("DRAFT");
  });

  it("validates answers server-side by question type (drafts are lenient on required)", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const me = await makeApplicant();
    const { id } = await startOrResumeApplication(me, opp.slug);
    await expect(saveApplicationStep(me, id, 3, 4, { answers: { size: "not-an-option" } })).rejects.toThrow(/highlighted/);
    await expect(saveApplicationStep(me, id, 4, 5, { answers: {}, requestedAmount: "999.00" })).rejects.toThrow(); // below min
    await expect(saveApplicationStep(me, id, 4, 5, { answers: {}, requestedAmount: "9999.00" })).rejects.toThrow(); // above max
    await expect(saveApplicationStep(me, id, 3, 4, { answers: { story: "" } })).resolves.toBeTruthy(); // blank allowed in draft
  });

  it("blocks submission until required answers exist and consent is given", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const me = await makeApplicant();
    const { id } = await startOrResumeApplication(me, opp.slug);
    await expect(submitApplication(me, id, consent)).rejects.toThrow(/required/i);
    const full = await filledDraft(me, opp.slug);
    await expect(submitApplication(me, full, { consentAccepted: false, consentTerms: true })).rejects.toThrow();
    await expect(submitApplication(me, full, {})).rejects.toThrow();
  });

  it("submits: unique reference, timeline, notification, consent record, audit, staff alert", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const me = await makeApplicant();
    const id = await filledDraft(me, opp.slug);
    const res = await submitApplication(me, id, consent);
    expect(res.reference).toMatch(/^NEN-DEMO-\d{4}-[A-Z2-9]{6}$/);
    const app = await db.application.findUniqueOrThrow({ where: { id }, include: { events: true } });
    expect(app.status).toBe("SUBMITTED");
    expect(app.submittedAt).toBeInstanceOf(Date);
    expect(app.events.map((e) => e.toStatus)).toEqual(["DRAFT", "SUBMITTED"]);
    expect(app.requestedAmountMinor).toBe(250000);
    expect(await db.notification.count({ where: { userId: me.id, title: "Application submitted" } })).toBe(1);
    expect(await db.consentRecord.count({ where: { applicationId: id, subject: "APPLICATION_SUBMISSION" } })).toBe(1);
    expect(await db.auditLog.count({ where: { entityId: id, action: "application.status_changed" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: admin.id, type: "STAFF_NEW_APPLICATION" } })).toBeGreaterThan(0);
  });

  it("cannot be edited or submitted twice once submitted", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const me = await makeApplicant();
    const id = await filledDraft(me, opp.slug);
    await submitApplication(me, id, consent);
    await expect(submitApplication(me, id, consent)).rejects.toThrow(/already been submitted/);
    await expect(saveApplicationStep(me, id, 3, 4, { answers: { story: "sneaky edit" } })).rejects.toThrow(/no longer be edited/);
  });

  it("prevents duplicates at the database level when the programme forbids them, even under concurrency", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const me = await makeApplicant();
    const results = await Promise.all(Array.from({ length: 5 }, () => startOrResumeApplication(me, opp.slug)));
    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(await db.application.count({ where: { opportunityId: opp.id, applicantUserId: me.id } })).toBe(1);

    // Withdrawing frees the slot.
    const first = results[0].id;
    await withdrawApplication(me, first, {});
    const next = await startOrResumeApplication(me, opp.slug);
    expect(next.id).not.toBe(first);
    expect(next.created).toBe(true);
  });

  it("allows several applications when the programme permits it", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin, { allowMultipleApplications: true });
    const me = await makeApplicant();
    const a = await filledDraft(me, opp.slug);
    await submitApplication(me, a, consent);
    const b = await startOrResumeApplication(me, opp.slug);
    expect(b.id).not.toBe(a);
  });

  it("enforces eligibility and the application window on the server", async () => {
    const admin = await makeStaff("ADMIN");
    const org = await makeApplicant("ORGANIZATION", { orgType: "SMALL_BUSINESS" });
    const indOnly = await makePublishedOpportunity(admin, { applicantTypes: ["INDIVIDUAL"] });
    await expect(startOrResumeApplication(org, indOnly.slug)).rejects.toThrow(/not accepted/);
    const expired = await makePublishedOpportunity(admin);
    await db.opportunity.update({ where: { id: expired.id }, data: { deadline: new Date("2000-01-01") } });
    const me = await makeApplicant();
    await expect(startOrResumeApplication(me, expired.slug)).rejects.toThrow(/deadline has passed/);
    const draftOnly = await makePublishedOpportunity(admin);
    await setOpportunityStatus(admin, draftOnly.id, "ARCHIVED");
    await expect(startOrResumeApplication(me, draftOnly.slug)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects submission after the deadline passes mid-draft", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const me = await makeApplicant();
    const id = await filledDraft(me, opp.slug);
    await db.opportunity.update({ where: { id: opp.id }, data: { deadline: new Date("2001-01-01") } });
    await expect(submitApplication(me, id, consent)).rejects.toThrow(/deadline/);
  });

  it("organization applications use explicit membership and the org's own type", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const org = await makeApplicant("ORGANIZATION", { orgType: "NONPROFIT" });
    const { id } = await startOrResumeApplication(org, opp.slug);
    const app = await db.application.findUniqueOrThrow({ where: { id } });
    expect(app.applicantMode).toBe("ORGANIZATION");
    expect(app.applicantCategory).toBe("NONPROFIT");
    expect(app.organizationId).not.toBeNull();
    // A different user with an identically-named org must not gain access.
    const impostor = await makeApplicant("ORGANIZATION", { orgType: "NONPROFIT" });
    await expect(getApplicationForEdit(impostor, id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(saveApplicationStep(impostor, id, 1, 2, { applicantCategory: "NONPROFIT", organizationId: app.organizationId! })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("access control (IDOR)", () => {
  it("applicants cannot read, edit, submit, withdraw or reply to another applicant's application", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin);
    const owner = await makeApplicant();
    const other = await makeApplicant();
    const id = await filledDraft(owner, opp.slug);
    await expect(getApplicantApplicationDetail(other, id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getApplicationForEdit(other, id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(submitApplication(other, id, consent)).rejects.toBeInstanceOf(NotFoundError);
    await expect(withdrawApplication(other, id, {})).rejects.toBeInstanceOf(NotFoundError);
    await expect(respondToInfoRequest(other, id, { body: "hi there" })).rejects.toBeInstanceOf(NotFoundError);
    expect((await listApplicantApplications(other)).rows).toHaveLength(0);
    expect((await listApplicantApplications(owner)).rows).toHaveLength(1);
  });

  it("staff-only services reject applicants", async () => {
    const applicant = await makeApplicant();
    await expect(getApplicationStaff(applicant, "x")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(decide(applicant, "x", { outcome: "APPROVE", reason: "long enough reason" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(assignReviewer(applicant, "x", { reviewerId: "y" })).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("review workflow", () => {
  async function submitted() {
    const admin = await makeStaff("ADMIN");
    const reviewer = await makeStaff("REVIEWER");
    const opp = await makePublishedOpportunity(admin);
    const me = await makeApplicant();
    const id = await filledDraft(me, opp.slug);
    await submitApplication(me, id, consent);
    return { admin, reviewer, me, id, opp };
  }

  it("reviewers only see applications assigned to them", async () => {
    const { admin, reviewer, id } = await submitted();
    const other = await makeStaff("REVIEWER");
    await expect(getApplicationStaff(reviewer, id)).rejects.toBeInstanceOf(NotFoundError);
    await assignReviewer(admin, id, { reviewerId: reviewer.id });
    await expect(getApplicationStaff(reviewer, id)).resolves.toBeTruthy();
    await expect(getApplicationStaff(other, id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(addReviewNote(other, id, { body: "I should not be able to" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("only administrators assign, and reassignment keeps history", async () => {
    const { admin, reviewer, id } = await submitted();
    const second = await makeStaff("REVIEWER");
    await expect(assignReviewer(reviewer, id, { reviewerId: reviewer.id })).rejects.toBeInstanceOf(ForbiddenError);
    await assignReviewer(admin, id, { reviewerId: reviewer.id });
    await assignReviewer(admin, id, { reviewerId: second.id });
    const rows = await db.applicationAssignment.findMany({ where: { applicationId: id }, orderBy: { createdAt: "asc" } });
    expect(rows.map((r) => r.isActive)).toEqual([false, true]);
    expect(rows[0].endedAt).toBeInstanceOf(Date);
    expect(await db.auditLog.count({ where: { entityId: id, action: "application.reviewer_assigned" } })).toBe(2);
    await expect(assignReviewer(admin, id, { reviewerId: second.id })).rejects.toThrow(/already assigned/);
    await expect(getApplicationStaff(reviewer, id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("walks the full path: review, info request + reply, recommendation, separate final approval", async () => {
    const { admin, reviewer, me, id } = await submitted();
    await assignReviewer(admin, id, { reviewerId: reviewer.id });
    await moveStatus(reviewer, id, { to: "INITIAL_REVIEW" });
    await moveStatus(reviewer, id, { to: "UNDER_REVIEW" });
    await addReviewNote(reviewer, id, { body: "INTERNAL: looks strong but budget unclear." });

    await requestInformation(reviewer, id, { message: "Please clarify the budget lines." });
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("INFO_REQUESTED");
    await respondToInfoRequest(me, id, { body: "Here is the budget clarification." });
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("UNDER_REVIEW");

    // Reviewer cannot make the final decision, and cannot approve before recommendation.
    await expect(decide(reviewer, id, { outcome: "APPROVE", reason: "I approve this one." })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(decide(admin, id, { outcome: "APPROVE", reason: "Skipping recommendation." })).rejects.toThrow(/cannot move/);

    await recommend(reviewer, id, { recommendation: "APPROVE", body: "Recommend approval subject to terms." });
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("RECOMMENDED");
    await decide(admin, id, { outcome: "APPROVE", reason: "Meets all criteria.", internalNotes: "Budget ok", applicantMessage: "Congratulations — approved (demo)." });
    const final = await db.application.findUniqueOrThrow({ where: { id }, include: { decisions: true, events: { orderBy: { createdAt: "asc" } } } });
    expect(final.status).toBe("APPROVED");
    expect(final.decidedAt).toBeInstanceOf(Date);
    expect(final.decisions.map((d) => `${d.kind}:${d.outcome}`)).toEqual(["RECOMMENDATION:APPROVE", "FINAL:APPROVE"]);
    expect(final.events.map((e) => e.toStatus)).toEqual(["DRAFT", "SUBMITTED", "INITIAL_REVIEW", "UNDER_REVIEW", "INFO_REQUESTED", "UNDER_REVIEW", "RECOMMENDED", "APPROVED"]);
    expect(await db.notification.count({ where: { userId: me.id, title: { startsWith: "Decision recorded" } } })).toBe(1);

    // The applicant view never exposes internal notes, reasons, or staff identities.
    const detail = await getApplicantApplicationDetail(me, id);
    const dump = JSON.stringify(detail);
    expect(dump).not.toContain("INTERNAL: looks strong");
    expect(dump).not.toContain("Meets all criteria");
    expect(dump).not.toContain("Budget ok");
    expect(dump).not.toContain("Recommend approval subject");
    expect(dump).toContain("Congratulations");
    expect(dump).not.toContain(reviewer.id);
    expect(dump).not.toContain(admin.id);
  });

  it("a recommended decline does not change the applicant-visible status; admin can then decline", async () => {
    const { admin, reviewer, id } = await submitted();
    await assignReviewer(admin, id, { reviewerId: reviewer.id });
    await moveStatus(reviewer, id, { to: "INITIAL_REVIEW" });
    await moveStatus(reviewer, id, { to: "UNDER_REVIEW" });
    await recommend(reviewer, id, { recommendation: "DECLINE", body: "Does not meet criterion 2." });
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("UNDER_REVIEW");
    await decide(admin, id, { outcome: "DECLINE", reason: "Agree with reviewer recommendation." });
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("DECLINED");
  });

  it("revision requests unlock editing and resubmission, recording reasons on the timeline", async () => {
    const { admin, reviewer, me, id } = await submitted();
    await assignReviewer(admin, id, { reviewerId: reviewer.id });
    await moveStatus(reviewer, id, { to: "INITIAL_REVIEW" });
    await requestRevision(reviewer, id, { message: "Please add the missing beneficiaries section." });
    expect((await getApplicationForEdit(me, id)).editable).toBe(true);
    await saveApplicationStep(me, id, 3, 4, { answers: { story: "Revised story." } });
    const res = await submitApplication(me, id, consent);
    expect(res.reference).toMatch(/^NEN-DEMO/);
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("SUBMITTED");
    const events = await db.applicationStatusEvent.findMany({ where: { applicationId: id }, orderBy: { createdAt: "asc" } });
    expect(events.find((e) => e.toStatus === "RESUBMISSION_REQUIRED")?.actorId).toBe(reviewer.id);
    expect(events.find((e) => e.toStatus === "RESUBMISSION_REQUIRED")?.internalNote).toContain("beneficiaries");
  });

  it("withdrawal is recorded and cannot be undone by the applicant", async () => {
    const { me, id, admin } = await submitted();
    await withdrawApplication(me, id, { reason: "No longer needed" });
    expect((await db.application.findUniqueOrThrow({ where: { id } })).status).toBe("WITHDRAWN");
    await expect(respondToInfoRequest(me, id, { body: "hello again" })).rejects.toThrow();
    await expect(moveStatus(admin, id, { to: "UNDER_REVIEW" })).rejects.toThrow(/cannot move/);
  });

  it("history tables are append-only at the database level", async () => {
    const { id } = await submitted();
    await expect(db.applicationStatusEvent.updateMany({ where: { applicationId: id }, data: { toStatus: "APPROVED" } })).rejects.toThrow(/append-only/);
    await expect(db.applicationStatusEvent.deleteMany({ where: { applicationId: id } })).rejects.toThrow(/append-only/);
    await expect(db.auditLog.updateMany({ data: { summary: "tampered" } })).rejects.toThrow(/append-only/);
    await expect(db.auditLog.deleteMany({})).rejects.toThrow(/append-only/);
  });
});
