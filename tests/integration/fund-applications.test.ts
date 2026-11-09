import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createFundApplication, getFundApplicationStaff, listFundApplicationsStaff, addFundApplicationNote, updateFundApplicationStatus } from "@/lib/services/fund-applications";
import { resetRateLimits } from "@/lib/rate-limit";
import { ForbiddenError } from "@/lib/permissions";
import { makeApplicant, makeStaff, uid } from "../helpers";

const application = (over: Record<string, unknown> = {}) => ({
  fullName: "Jamie Example",
  email: `jamie-${uid()}@example.test`,
  phone: "+1 555 010 2030",
  country: "United States",
  applicantType: "ENTREPRENEUR",
  story: "I run a small training studio.",
  purpose: "Fund a community training programme for young people.",
  useOfFunds: "Pay for a venue, materials and two part-time tutors.",
  amountRequested: "75000",
  budgetSummary: "Venue 15,000; materials 20,000; tutors 40,000.",
  hasConflict: false,
  conflictDetails: "",
  consent: true,
  ...over,
});

describe("public fund applications", () => {
  it("validates on the server and stores a submission with a reference and a consent record", async () => {
    await expect(createFundApplication(application({ consent: false }))).rejects.toThrow();
    await expect(createFundApplication(application({ amountRequested: "100" }))).rejects.toThrow(/between/);
    await expect(createFundApplication(application({ country: "Ghana" }))).rejects.toThrow(/located in Africa/);
    await expect(createFundApplication(application({ website: "http://spam.example" }))).rejects.toThrow(/could not be submitted/);
    await expect(createFundApplication(application({ hasConflict: true, conflictDetails: "" }))).rejects.toThrow(/describe the relationship/);

    const app = await createFundApplication(application({ hasConflict: true, conflictDetails: "My cousin reviews for NEN." }));
    expect(app.reference).toMatch(/^NEN-APP-\d{4}-[A-Z2-9]{6}$/);
    expect(app.status).toBe("RECEIVED");
    expect(app.amountMinor).toBe(7_500_000);
    expect(app.currency).toBe("USD");
    expect(app.hasConflict).toBe(true);
    expect(app.conflictDetails).toBe("My cousin reviews for NEN.");
    const consent = await db.consentRecord.findFirst({ where: { fundApplicationId: app.id } });
    expect(consent?.subject).toBe("FUND_APPLICATION");
    expect(consent?.userId).toBeNull();
  });

  it("rate-limits repeat submissions from the same email address", async () => {
    resetRateLimits();
    const email = `repeat-${uid()}@example.test`;
    for (let i = 0; i < 3; i++) await createFundApplication(application({ email }));
    await expect(createFundApplication(application({ email }))).rejects.toThrow(/several applications/);
    // a different email is not affected
    await expect(createFundApplication(application())).resolves.toMatchObject({ status: "RECEIVED" });
  });

  it("is staff-only in admin: listing, status changes with audit, and internal notes", async () => {
    const admin = await makeStaff("ADMIN");
    const reviewer = await makeStaff("REVIEWER");
    const applicantActor = await makeApplicant();
    const app = await createFundApplication(application({ fullName: `Zelda ${uid()}` }));

    await expect(listFundApplicationsStaff(reviewer)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listFundApplicationsStaff(applicantActor)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getFundApplicationStaff(reviewer, app.id)).rejects.toBeInstanceOf(ForbiddenError);

    const list = await listFundApplicationsStaff(admin, { q: app.reference });
    expect(list.total).toBe(1);
    expect(list.rows[0].id).toBe(app.id);

    await updateFundApplicationStatus(admin, app.id, { status: "IN_REVIEW" });
    const audit = await db.auditLog.findFirst({ where: { entityType: "FundApplication", entityId: app.id, action: "fundApplication.updated" } });
    expect(audit?.summary).toContain("RECEIVED → IN_REVIEW");

    await addFundApplicationNote(admin, app.id, { body: "Internal: eligibility looks fine." });
    const detail = await getFundApplicationStaff(admin, app.id);
    expect(detail.app.status).toBe("IN_REVIEW");
    expect(detail.app.notes).toHaveLength(1);
    expect(detail.app.notes[0].body).toContain("eligibility looks fine");
    expect(detail.authors[admin.id]).toBe(admin.name);
  });
});
