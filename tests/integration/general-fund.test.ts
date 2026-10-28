import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { GENERAL_FUND_INPUT } from "@/config/general-fund";
import { opportunitySchema } from "@/lib/validation/opportunity";
import { canPublish, saveOpportunity, setOpportunityStatus, toView } from "@/lib/services/opportunities";
import { saveApplicationStep, startOrResumeApplication, getApplicationForEdit } from "@/lib/services/applications";
import { ValidationError } from "@/lib/permissions";
import { makeApplicant, makePublishedOpportunity, makeStaff, uid } from "../helpers";

describe("General Opportunity Fund definition", () => {
  it("is valid input with a USD 25,000–500,000 request range", () => {
    const v = opportunitySchema.parse(GENERAL_FUND_INPUT);
    expect(v.minAmount).toBe("25000.00");
    expect(v.maxAmount).toBe("500000.00");
    expect(v.questions.length).toBeGreaterThan(0);
    expect(v.opensAt?.toISOString().slice(0, 10)).toBe("2026-11-01");
    expect(v.funderVerified).toBe(false);
    expect(v.termsApproved).toBe(false);
  });

  it("is stored as an unpublished LIVE draft, with the range in minor units", async () => {
    const admin = await makeStaff("ADMIN");
    const saved = await saveOpportunity(admin, null, { ...GENERAL_FUND_INPUT, slug: `general-fund-${uid()}`, title: `General Opportunity Fund ${uid()}` }, "LIVE");
    const row = await db.opportunity.findUniqueOrThrow({ where: { id: saved.id }, include: { questions: true } });
    expect(row.classification).toBe("LIVE");
    expect(row.status).toBe("DRAFT");
    expect(row.minAmountMinor).toBe(2_500_000);
    expect(row.maxAmountMinor).toBe(50_000_000);
    expect(row.verifiedAt).toBeNull();
  });

  it("cannot be published until it is verified: funder, terms and dates are still missing", async () => {
    const admin = await makeStaff("ADMIN");
    const saved = await saveOpportunity(admin, null, { ...GENERAL_FUND_INPUT, slug: `general-fund-${uid()}`, title: `General Opportunity Fund ${uid()}` }, "LIVE");
    const row = await db.opportunity.findUniqueOrThrow({ where: { id: saved.id }, include: { questions: true } });
    const gate = canPublish(toView(row));
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.missing.join(" ")).toMatch(/Funding organization|verification/i);
    await expect(setOpportunityStatus(admin, saved.id, "PUBLISHED")).rejects.toThrow(/cannot be published/i);
  });
});

describe("requesting an amount inside the 25,000–500,000 range", () => {
  it("accepts amounts in range, rejects below/above, and stores minor units", async () => {
    const admin = await makeStaff("ADMIN");
    const opp = await makePublishedOpportunity(admin, { minAmount: "25000.00", maxAmount: "500000.00" });
    const me = await makeApplicant();
    const { id } = await startOrResumeApplication(me, opp.slug);
    const attempt = (amount: string) => saveApplicationStep(me, id, 4, 5, { answers: { purpose: "A fictional purpose." }, requestedAmount: amount });
    await expect(attempt("24,999.99")).rejects.toThrow(ValidationError);
    await expect(attempt("500,000.01")).rejects.toThrow(ValidationError);
    await expect(attempt("abc")).rejects.toThrow(ValidationError);
    await attempt("25,000.00");
    expect((await getApplicationForEdit(me, id)).app.requestedAmountMinor).toBe(2_500_000);
    await attempt("500,000.00");
    expect((await getApplicationForEdit(me, id)).app.requestedAmountMinor).toBe(50_000_000);
    await attempt("120,000");
    expect((await getApplicationForEdit(me, id)).app.requestedAmountMinor).toBe(12_000_000);
  });
});
