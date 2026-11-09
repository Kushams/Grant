import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  canPublish, getLiveReadiness, getOpportunityAdmin, saveOpportunity, searchOpportunities, setOpportunityStatus, verifyAndMarkLive, toggleSaved, listSaved,
} from "@/lib/services/opportunities";
import { ForbiddenError } from "@/lib/permissions";
import { baseOpportunityInput, makeApplicant, makeStaff, uid } from "../helpers";

describe("opportunity management", () => {
  it("only administrators can create or publish", async () => {
    const reviewer = await makeStaff("REVIEWER");
    const applicant = await makeApplicant();
    await expect(saveOpportunity(reviewer, null, baseOpportunityInput())).rejects.toBeInstanceOf(ForbiddenError);
    await expect(saveOpportunity(applicant, null, baseOpportunityInput())).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("creates a DRAFT demo opportunity with a reference, slug and questions", async () => {
    const admin = await makeStaff("ADMIN");
    const { id } = await saveOpportunity(admin, null, baseOpportunityInput({ title: "Reference Test Programme" }));
    const o = await getOpportunityAdmin(id);
    expect(o?.status).toBe("DRAFT");
    expect(o?.classification).toBe("DEMO");
    expect(o?.reference).toMatch(/^NEN-OPP-DEMO-\d{4}-[A-Z2-9]{6}$/);
    expect(o?.slug).toBe("reference-test-programme");
    expect(o?.questions).toHaveLength(3);
    expect(o?.requireProposal).toBe(true);
    expect(o?.feePolicyStatus).toBe("NONE");
  });

  it("generates unique slugs for duplicate titles", async () => {
    const admin = await makeStaff("ADMIN");
    const a = await saveOpportunity(admin, null, baseOpportunityInput({ title: "Same Title Everywhere" }));
    const b = await saveOpportunity(admin, null, baseOpportunityInput({ title: "Same Title Everywhere" }));
    expect(a.slug).not.toBe(b.slug);
  });

  it("validates funding configuration (range vs fixed, min>max, positive amounts)", async () => {
    const admin = await makeStaff("ADMIN");
    await expect(saveOpportunity(admin, null, baseOpportunityInput({ minAmount: "9000", maxAmount: "1000" }))).rejects.toThrow();
    await expect(saveOpportunity(admin, null, baseOpportunityInput({ fixedAmount: "1000" }))).rejects.toThrow();
    await expect(saveOpportunity(admin, null, baseOpportunityInput({ minAmount: "0", maxAmount: "0" }))).rejects.toThrow();
    await expect(saveOpportunity(admin, null, baseOpportunityInput({ minAmount: "", maxAmount: "", fixedAmount: "" }))).rejects.toThrow();
    await expect(saveOpportunity(admin, null, baseOpportunityInput({ currency: "XXX" }))).rejects.toThrow();
    await expect(saveOpportunity(admin, null, baseOpportunityInput({ opensAt: "2030-01-01", deadline: "2029-01-01" }))).rejects.toThrow();
    await expect(saveOpportunity(admin, null, baseOpportunityInput({ questions: [{ key: "a", label: "Dup question", type: "SHORT_TEXT" }, { key: "a", label: "Dup question 2", type: "SHORT_TEXT" }] }))).rejects.toThrow(/Duplicate/);
  });

  it("stores amounts as integer minor units in the configured currency", async () => {
    const admin = await makeStaff("ADMIN");
    const { id } = await saveOpportunity(admin, null, baseOpportunityInput({ currency: "EUR", minAmount: "1,250.50", maxAmount: "4000" }));
    const o = await getOpportunityAdmin(id);
    expect(o?.currency).toBe("EUR");
    expect(o?.minAmountMinor).toBe(125050);
    expect(o?.maxAmountMinor).toBe(400000);
  });

  it("publishing needs applicant types; DEMO stays DEMO when published", async () => {
    const admin = await makeStaff("ADMIN");
    const { id } = await saveOpportunity(admin, null, baseOpportunityInput({ applicantTypes: [] }));
    await expect(setOpportunityStatus(admin, id, "PUBLISHED")).rejects.toThrow(/applicant type/);
    await saveOpportunity(admin, id, baseOpportunityInput({ applicantTypes: ["INDIVIDUAL"] }));
    await setOpportunityStatus(admin, id, "PUBLISHED");
    const o = await getOpportunityAdmin(id);
    expect(o?.status).toBe("PUBLISHED");
    expect(o?.isDemo).toBe(true);
  });

  it("a normal edit can never turn a DEMO opportunity into LIVE", async () => {
    const admin = await makeStaff("ADMIN");
    const { id } = await saveOpportunity(admin, null, baseOpportunityInput());
    await saveOpportunity(admin, id, { ...baseOpportunityInput(), classification: "LIVE", verifiedAt: "2026-01-01" } as never);
    expect((await getOpportunityAdmin(id))?.classification).toBe("DEMO");
    expect((await getOpportunityAdmin(id))?.verifiedAt).toBeNull();
  });

  it("LIVE conversion requires every readiness item plus explicit confirmation, and records who/when", async () => {
    const admin = await makeStaff("ADMIN");
    const { id } = await saveOpportunity(admin, null, baseOpportunityInput());
    const incomplete = (await getOpportunityAdmin(id))!;
    expect(getLiveReadiness(incomplete).some((i) => !i.done)).toBe(true);
    await expect(verifyAndMarkLive(admin, id, { confirm: true, note: "Checked every detail with partner." })).rejects.toThrow(/Still to confirm/);

    const full = baseOpportunityInput({
      funderName: "Example Funder (verified)", funderVerified: true, programmeTerms: "Approved terms text.", termsApproved: true,
      opensAt: "2026-01-01", deadline: "2999-01-01", selectionProcess: "Panel review.", decisionTimeline: "8 weeks",
      paymentSchedule: "Two instalments", awardType: "Grant (cash)",
    });
    await saveOpportunity(admin, id, full);
    await expect(verifyAndMarkLive(admin, id, { confirm: false, note: "Checked every detail." })).rejects.toThrow();
    await expect(verifyAndMarkLive(await makeStaff("REVIEWER"), id, { confirm: true, note: "Checked every detail." })).rejects.toBeInstanceOf(ForbiddenError);
    await verifyAndMarkLive(admin, id, { confirm: true, note: "Checked every detail with partner." });
    const live = (await getOpportunityAdmin(id))!;
    expect(live.classification).toBe("LIVE");
    expect(live.verifiedById).toBe(admin.id);
    expect(live.verifiedAt).toBeInstanceOf(Date);
    expect(canPublish(live).ok).toBe(true);

    // Editing a material fact voids verification and unpublishes.
    await setOpportunityStatus(admin, id, "PUBLISHED");
    const res = await saveOpportunity(admin, id, { ...full, programmeTerms: "Changed terms!" });
    expect(res.unpublished).toBe(true);
    const after = (await getOpportunityAdmin(id))!;
    expect(after.verifiedAt).toBeNull();
    expect(after.status).toBe("DRAFT");
    expect(await db.auditLog.count({ where: { entityId: id, action: "opportunity.verified_live" } })).toBe(1);
  });

  it("writes audit entries for creation, funding and eligibility changes", async () => {
    const admin = await makeStaff("ADMIN");
    const { id } = await saveOpportunity(admin, null, baseOpportunityInput());
    await saveOpportunity(admin, id, baseOpportunityInput({ maxAmount: "9000", deadline: "2998-02-02" }));
    const actions = (await db.auditLog.findMany({ where: { entityId: id } })).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["opportunity.created", "opportunity.updated", "opportunity.funding_config_changed", "opportunity.eligibility_changed"]));
  });
});

describe("public search", () => {
  it("only returns PUBLISHED opportunities and filters really change results", async () => {
    const admin = await makeStaff("ADMIN");
    const tag = uid();
    const mk = async (over: Record<string, unknown>, publish = true) => {
      const { id } = await saveOpportunity(admin, null, baseOpportunityInput({ keywords: [`kw${tag}`], ...over }));
      if (publish) await setOpportunityStatus(admin, id, "PUBLISHED");
      return id;
    };
    await mk({ title: `Alpha Farming ${tag}`, category: "Agriculture & food security", applicantTypes: ["SMALL_BUSINESS"], eligibleRegions: ["Africa"], deadline: "2999-01-01", maxAmount: "20000" });
    await mk({ title: `Beta Coding ${tag}`, category: "Technology & innovation", applicantTypes: ["INDIVIDUAL"], eligibleRegions: ["Middle East & North Africa"], deadline: "2000-01-01", maxAmount: "2000" });
    await mk({ title: `Gamma Draft ${tag}`, applicantTypes: ["INDIVIDUAL"] }, false);
    await mk({ title: `Delta Euro ${tag}`, currency: "EUR", minAmount: "10", maxAmount: "30000", applicantTypes: ["INDIVIDUAL"], eligibleRegions: ["Europe"], deadline: "" });

    const all = await searchOpportunities({ q: tag });
    expect(all.items.map((i) => i.title).sort()).toEqual([`Alpha Farming ${tag}`, `Beta Coding ${tag}`, `Delta Euro ${tag}`]);

    expect((await searchOpportunities({ q: tag, category: "Agriculture & food security" })).items).toHaveLength(1);
    expect((await searchOpportunities({ q: tag, applicantType: "INDIVIDUAL" })).total).toBe(2);
    expect((await searchOpportunities({ q: tag, region: "Africa" })).items.map((i) => i.title)).toEqual([`Alpha Farming ${tag}`]); // exact element, not "North Africa"
    expect((await searchOpportunities({ q: tag, status: "open" })).total).toBe(2);
    expect((await searchOpportunities({ q: tag, status: "closed" })).items.map((i) => i.title)).toEqual([`Beta Coding ${tag}`]);
    expect((await searchOpportunities({ q: tag, deadline: "none" })).items.map((i) => i.title)).toEqual([`Delta Euro ${tag}`]);
    expect((await searchOpportunities({ q: tag, currency: "USD", minFunding: "10000" })).items.map((i) => i.title)).toEqual([`Alpha Farming ${tag}`]);
    expect((await searchOpportunities({ q: tag, currency: "EUR", minFunding: "10000" })).items.map((i) => i.title)).toEqual([`Delta Euro ${tag}`]);
    expect((await searchOpportunities({ q: "no-such-thing-xyz" })).total).toBe(0);
    expect((await searchOpportunities({ q: tag, sort: "title" })).items[0].title).toContain("Alpha");
    const page1 = await searchOpportunities({ q: tag, pageSize: 2, page: 1 });
    expect(page1.items).toHaveLength(2);
    expect(page1.pages).toBe(2);
  });

  it("archived opportunities disappear from the public directory", async () => {
    const admin = await makeStaff("ADMIN");
    const tag = uid();
    const { id } = await saveOpportunity(admin, null, baseOpportunityInput({ title: `Archive Me ${tag}` }));
    await setOpportunityStatus(admin, id, "PUBLISHED");
    expect((await searchOpportunities({ q: tag })).total).toBe(1);
    await setOpportunityStatus(admin, id, "ARCHIVED");
    expect((await searchOpportunities({ q: tag })).total).toBe(0);
    expect((await getOpportunityAdmin(id))?.archivedAt).toBeInstanceOf(Date);
  });

  it("lets applicants save and unsave published opportunities", async () => {
    const admin = await makeStaff("ADMIN");
    const user = await makeApplicant();
    const { id } = await saveOpportunity(admin, null, baseOpportunityInput());
    await expect(toggleSaved(user.id, id)).rejects.toThrow(); // not published yet
    await setOpportunityStatus(admin, id, "PUBLISHED");
    expect(await toggleSaved(user.id, id)).toBe(true);
    expect((await listSaved(user.id)).map((o) => o.id)).toEqual([id]);
    expect(await toggleSaved(user.id, id)).toBe(false);
    expect(await listSaved(user.id)).toHaveLength(0);
  });
});
