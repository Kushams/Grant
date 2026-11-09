/**
 * Seeds FICTIONAL demonstration data for local development.
 *
 *  - Everything is invented. Emails use the reserved `.test` TLD (cannot be real mailboxes).
 *  - Records are created through the real service layer, so timelines, notifications and
 *    audit entries are genuine rather than hand-inserted.
 *  - Repeatable: it refuses to run twice. Use `npm run db:reset` to wipe and re-seed.
 *  - Refuses to run when NODE_ENV=production.
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";
import type { Actor } from "../src/lib/permissions";
import type { Role } from "../src/lib/constants";
import { registerUser } from "../src/lib/services/users";
import { saveOpportunity, setOpportunityStatus, toggleSaved } from "../src/lib/services/opportunities";
import { respondToInfoRequest, saveApplicationStep, startOrResumeApplication, submitApplication, withdrawApplication } from "../src/lib/services/applications";
import { addReviewNote, assignReviewer, decide, moveStatus, recommend, requestInformation, requestRevision } from "../src/lib/services/review";
import { changeDisbursementStatus, createAward, createDisbursement } from "../src/lib/services/awards";
import { addSupportNote, createSupportRequest, updateSupportStatus } from "../src/lib/services/support";
import { PROJECT_PRESETS } from "../src/lib/constants";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed demo data when NODE_ENV=production.");
  process.exit(1);
}

const PASSWORD = process.env.DEMO_SEED_PASSWORD || "Demo-Passw0rd!";
const EMAIL_DOMAIN = "demo.nen.test";
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const consent = { consentAccepted: true, consentTerms: true };

async function staff(name: string, email: string, role: "ADMIN" | "REVIEWER"): Promise<Actor> {
  const u = await db.user.create({ data: { name, email, role, isDemo: true, passwordHash: await hashPassword(PASSWORD) } });
  return { id: u.id, role: role as Role, name };
}

async function applicant(name: string, email: string, kind: "INDIVIDUAL" | "ORG", extra: { orgName?: string; orgType?: string; country: string; city: string; category?: string; contact?: string; description?: string; background?: string }) {
  const { userId, role } = await registerUser({
    name, email, password: PASSWORD, confirmPassword: PASSWORD, accountType: kind === "INDIVIDUAL" ? "INDIVIDUAL_APPLICANT" : "ORGANIZATION_APPLICANT",
    organizationName: extra.orgName, organizationType: extra.orgType, consentPrivacy: true,
  });
  await db.user.update({ where: { id: userId }, data: { isDemo: true } });
  if (kind === "INDIVIDUAL") {
    await db.individualProfile.update({ where: { userId }, data: { country: extra.country, city: extra.city, applicantCategory: extra.category ?? "INDIVIDUAL", background: extra.background ?? "Fictional demo profile.", interests: JSON.stringify(["Education & skills", "Entrepreneurship & small business"]) } });
  } else {
    const m = await db.organizationMembership.findFirstOrThrow({ where: { userId } });
    await db.organizationProfile.update({ where: { id: m.organizationId }, data: { country: extra.country, city: extra.city, contactEmail: extra.contact ?? `contact@${extra.orgName!.toLowerCase().replace(/[^a-z]+/g, "-")}.demo.test`, description: extra.description ?? "A fictional organization created for demonstration purposes.", sectors: JSON.stringify(["Community development"]) } });
  }
  return { id: userId, role: role as Role, name } as Actor;
}

const projectQs = (names: string[]) =>
  PROJECT_PRESETS.filter((p) => names.includes(p.key)).map((p) => ({ key: p.key, label: p.label, helpText: p.help, type: p.type, required: ["purpose", "use_of_funds"].includes(p.key), section: "PROJECT" as const, options: [] }));
const generalQs = [
  { key: "story", label: "Tell us about yourself or your organization", helpText: "A few sentences. This is fictional demo data.", type: "LONG_TEXT" as const, required: true, section: "GENERAL" as const, options: [] },
  { key: "stage", label: "Which best describes your current stage?", type: "SINGLE_CHOICE" as const, required: false, section: "GENERAL" as const, options: ["Idea", "Early", "Established"] },
  { key: "team", label: "How many people are involved?", type: "NUMBER" as const, required: false, section: "GENERAL" as const, options: [] },
];
const supportingQs = [
  { key: "website", label: "Link to more information (optional)", type: "URL" as const, required: false, section: "SUPPORTING" as const, options: [] },
  { key: "extra_info", label: "Anything else the reviewers should know? (non-sensitive)", type: "SUPPORTING_INFO" as const, required: false, section: "SUPPORTING" as const, options: [] },
];

type OppSeed = Record<string, unknown> & { title: string };
const NOTE = "DEMO — NOT A LIVE FUNDING OPPORTUNITY. Every detail here is fictional and exists only to test the platform.";
const base = (o: OppSeed) => ({
  description: `${NOTE}\n\n${o.longText ?? "This invented programme demonstrates how an opportunity page, eligibility rules, funding structure and application questions are presented."}`,
  eligibleRegions: ["Global (all countries)"],
  keywords: ["demo"],
  fundingSpecified: true,
  currency: "USD",
  awardType: "Grant (cash)",
  eligibilityCriteria: ["Be a fictional applicant", "Provide accurate information (all demo)"],
  requiredInformation: ["A short description of your plan"],
  requiredDocuments: [],
  selectionProcess: "Demo process: completeness check, reviewer assessment, recommendation, then a separate administrator decision.",
  decisionTimeline: "Demo only — no real timeline.",
  programmeTerms: "DEMO TERMS (not approved): this fictional programme creates no obligation, funds, or award.",
  termsApproved: false,
  funderName: "Fictional Demo Funder (not a real organization)",
  funderVerified: false,
  faq: [{ q: "Is this a real programme?", a: "No. It is a fictional demonstration used to test the platform." }],
  questions: [...generalQs, ...projectQs(["purpose", "use_of_funds", "expected_outcomes", "beneficiaries"]), ...supportingQs],
  ...o,
});

async function main() {
  if ((await db.user.count({ where: { email: `admin@${EMAIL_DOMAIN}` } })) > 0) {
    console.log("Demo data already present. Run `npm run db:reset` to wipe the local database and re-seed.");
    return;
  }
  console.log("Seeding fictional demo data…");

  // ---- staff
  const admin = await staff("Avery Admin (Demo)", `admin@${EMAIL_DOMAIN}`, "ADMIN");
  const rev1 = await staff("Riley Reviewer (Demo)", `reviewer1@${EMAIL_DOMAIN}`, "REVIEWER");
  const rev2 = await staff("Morgan Reviewer (Demo)", `reviewer2@${EMAIL_DOMAIN}`, "REVIEWER");

  // ---- applicants
  const jordan = await applicant("Jordan Demo", `individual1@${EMAIL_DOMAIN}`, "INDIVIDUAL", { country: "Ghana", city: "Demo City" });
  const sam = await applicant("Sam Demo", `individual2@${EMAIL_DOMAIN}`, "INDIVIDUAL", { country: "Kenya", city: "Sampleton", category: "ENTREPRENEUR", background: "Fictional entrepreneur building a demo venture." });
  const taylor = await applicant("Taylor Demo", `individual3@${EMAIL_DOMAIN}`, "INDIVIDUAL", { country: "India", city: "Exampleville" });
  const casey = await applicant("Casey Demo", `individual4@${EMAIL_DOMAIN}`, "INDIVIDUAL", { country: "Nigeria", city: "Testburg", category: "ENTREPRENEUR" });
  const coop = await applicant("Dana Demo (Co-op)", `org1@${EMAIL_DOMAIN}`, "ORG", { orgName: "Fictional Community Co-op", orgType: "COMMUNITY_ORG", country: "Ghana", city: "Demo City" });
  const farm = await applicant("Eden Demo (Farmers)", `org2@${EMAIL_DOMAIN}`, "ORG", { orgName: "Imaginary Farmers Cooperative Ltd", orgType: "SMALL_BUSINESS", country: "Kenya", city: "Sampleton" });
  const youth = await applicant("Frankie Demo (Youth)", `org3@${EMAIL_DOMAIN}`, "ORG", { orgName: "Example Youth Foundation", orgType: "NONPROFIT", country: "India", city: "Exampleville" });

  // ---- opportunities (ALL fictional DEMO)
  const mk = async (o: OppSeed, publish = true) => {
    const { id } = await saveOpportunity(admin, null, base(o), "DEMO");
    if (publish) await setOpportunityStatus(admin, id, "PUBLISHED");
    return db.opportunity.findUniqueOrThrow({ where: { id } });
  };
  const opp1 = await mk({ title: "Demo Micro-Enterprise Starter Programme", shortDescription: "Fictional starter support for new entrepreneurs and small businesses (demo).", category: "Entrepreneurship & small business", applicantTypes: ["INDIVIDUAL", "ENTREPRENEUR", "SMALL_BUSINESS"], eligibleRegions: ["Africa", "Asia-Pacific"], minAmount: "1000.00", maxAmount: "5000.00", opensAt: day(-30), deadline: day(60), plannedInstallments: 2, paymentSchedule: "Two instalments (demo)", keywords: ["demo", "startup", "enterprise"] });
  const opp2 = await mk({ title: "Demo Community Skills Training Fund", shortDescription: "Fictional fixed-amount fund for community training projects (demo).", category: "Education & skills", applicantTypes: ["NONPROFIT", "COMMUNITY_ORG"], eligibleRegions: ["Asia-Pacific", "Africa"], currency: "EUR", fixedAmount: "12000.00", opensAt: day(-20), deadline: day(45), plannedInstallments: 3, paymentSchedule: "Three instalments (demo)", keywords: ["demo", "training", "skills"] });
  const opp3 = await mk({ title: "Demo Smallholder Farming Resilience Grant", shortDescription: "Fictional grant for small farming businesses and cooperatives (demo).", category: "Agriculture & food security", applicantTypes: ["SMALL_BUSINESS", "COMMUNITY_ORG", "INDIVIDUAL"], eligibleRegions: ["Africa"], currency: "GHS", minAmount: "20000.00", maxAmount: "60000.00", opensAt: day(-40), deadline: day(20), keywords: ["demo", "farming", "agriculture"] });
  const opp4 = await mk({ title: "Demo Youth Digital Skills Mentorship", shortDescription: "Fictional mentorship programme — amount to be confirmed (demo).", category: "Technology & innovation", applicantTypes: ["INDIVIDUAL"], fundingSpecified: false, awardType: "Mentorship / training", opensAt: day(-10), deadline: day(90), questions: [...generalQs, ...supportingQs], keywords: ["demo", "digital", "youth"] });
  await mk({ title: "Demo Community Health Volunteers Support", shortDescription: "Fictional support for community health volunteer groups — opens soon (demo).", category: "Health & wellbeing", applicantTypes: ["NONPROFIT", "COMMUNITY_ORG"], currency: "GBP", maxAmount: "25000.00", opensAt: day(10), deadline: day(100), keywords: ["demo", "health"] });
  await mk({ title: "Demo Creative Arts Residency Support", shortDescription: "Fictional residency support — now closed (demo).", category: "Arts & culture", applicantTypes: ["INDIVIDUAL", "ENTREPRENEUR"], minAmount: "500.00", maxAmount: "3000.00", opensAt: day(-90), deadline: day(-15), keywords: ["demo", "arts"] });
  await mk({ title: "Demo Clean Energy Innovators Challenge", shortDescription: "Fictional unpublished draft opportunity (demo).", category: "Environment & climate", applicantTypes: ["REGISTERED_BUSINESS", "SMALL_BUSINESS"], maxAmount: "50000.00", keywords: ["demo", "energy"] }, false);
  const archived = await mk({ title: "Demo Archived Pilot Programme (2025)", shortDescription: "Fictional pilot that has been archived (demo).", category: "Community development", applicantTypes: ["COMMUNITY_ORG"], maxAmount: "8000.00", deadline: day(-200) });
  await setOpportunityStatus(admin, archived.id, "ARCHIVED");
  // A LIVE-classified template with deliberately missing facts, to demonstrate the verification checklist.
  await saveOpportunity(admin, null, {
    title: "Programme template — details to be confirmed", shortDescription: "Placeholder for a future verified programme. Nothing here is confirmed.",
    description: "Placeholder awaiting official programme details. No eligibility, dates, funder, amounts or terms have been supplied or verified, so this cannot be published as a live programme.",
    category: "Community development",
  }, "LIVE");

  // ---- applications through the real workflow
  const answers = (extra: Record<string, string> = {}) => ({ story: "A fictional description of who we are and what we want to do.", stage: "Early", team: "4", ...extra });
  const project = { purpose: "Demonstration purpose: test the end-to-end flow.", use_of_funds: "Fictional use of funds for the demo.", expected_outcomes: "Illustrative outcomes only.", beneficiaries: "Imaginary beneficiaries." };
  async function apply(who: Actor, opp: { id: string; slug: string; fixedAmountMinor?: number | null }, opts: { amount?: string; submit?: boolean; category?: string } = {}) {
    const { id } = await startOrResumeApplication(who, opp.slug);
    const isOrg = who.role === "ORGANIZATION_APPLICANT";
    const orgId = isOrg ? (await db.application.findUniqueOrThrow({ where: { id } })).organizationId! : undefined;
    await saveApplicationStep(who, id, 1, 2, { applicantCategory: isOrg ? "ORGANIZATION" : opts.category ?? "INDIVIDUAL", organizationId: orgId });
    await saveApplicationStep(who, id, 3, 4, { answers: answers() });
    await saveApplicationStep(who, id, 4, 5, { answers: project, requestedAmount: opts.amount });
    await saveApplicationStep(who, id, 5, 6, { answers: { website: "https://example.org/demo", extra_info: "Demo supporting information." } });
    if (opts.submit !== false) await submitApplication(who, id, consent);
    return id;
  }

  // A: just submitted, unassigned
  await apply(jordan, opp1, { amount: "2500.00" });
  // B: under review with notes (reviewer 1)
  const b = await apply(sam, opp1, { amount: "4000.00", category: "ENTREPRENEUR" });
  await assignReviewer(admin, b, { reviewerId: rev1.id });
  await moveStatus(rev1, b, { to: "INITIAL_REVIEW" });
  await moveStatus(rev1, b, { to: "UNDER_REVIEW" });
  await addReviewNote(rev1, b, { body: "Demo note: plan looks coherent; budget summary is thin but acceptable at this stage." });
  // C: information requested (reviewer 2)
  const c = await apply(taylor, opp4);
  await assignReviewer(admin, c, { reviewerId: rev2.id });
  await moveStatus(rev2, c, { to: "INITIAL_REVIEW" });
  await requestInformation(rev2, c, { message: "Could you tell us a little more about the mentoring support you are looking for? (demo request)" });
  // D: recommended, awaiting final decision
  const d = await apply(coop, opp2);
  await assignReviewer(admin, d, { reviewerId: rev1.id });
  await moveStatus(rev1, d, { to: "INITIAL_REVIEW" });
  await moveStatus(rev1, d, { to: "UNDER_REVIEW" });
  await recommend(rev1, d, { recommendation: "APPROVE", body: "Demo recommendation: meets all criteria; recommend approval at the fixed amount." });
  // E: approved + award + partially disbursed (GHS)
  const e = await apply(farm, opp3, { amount: "40000.00" });
  await assignReviewer(admin, e, { reviewerId: rev2.id });
  await moveStatus(rev2, e, { to: "INITIAL_REVIEW" });
  await moveStatus(rev2, e, { to: "UNDER_REVIEW" });
  await recommend(rev2, e, { recommendation: "APPROVE", body: "Demo: strong fit." });
  await decide(admin, e, { outcome: "APPROVE", reason: "Demo approval after panel discussion.", internalNotes: "Fictional internal note.", applicantMessage: "Congratulations — your demo application was approved. This is not a real award." });
  const awardE = await createAward(admin, { applicationId: e, amount: "40000.00", currency: "GHS", acceptanceStatus: "ACCEPTED", conditions: "Demo conditions: submit a short progress update before the second instalment.", applicantSummary: "Fictional award of GHS 40,000 in two planned instalments.", internalNotes: "Demo internal note." });
  const e1 = await createDisbursement(admin, { awardId: awardE.id, amount: "20000.00", plannedDate: day(-14), milestone: "On signing (demo)", applicantNote: "First planned instalment." });
  await changeDisbursementStatus(admin, e1.id, { to: "AWAITING_PROCESSING", reason: "Passed to the (fictional) finance team." });
  await changeDisbursementStatus(admin, e1.id, { to: "PAID_MANUAL", reason: "Fictional finance ref DEMO-FIN-0001, entered manually.", acknowledgeManual: true });
  await createDisbursement(admin, { awardId: awardE.id, amount: "20000.00", plannedDate: day(30), milestone: "After progress update (demo)", applicantNote: "Second planned instalment — subject to the progress update." });
  // F: approved + award + scheduled (one overdue) (EUR)
  const f = await apply(youth, opp2);
  await assignReviewer(admin, f, { reviewerId: rev1.id });
  await moveStatus(rev1, f, { to: "INITIAL_REVIEW" });
  await moveStatus(rev1, f, { to: "UNDER_REVIEW" });
  await recommend(rev1, f, { recommendation: "APPROVE", body: "Demo: recommend approval." });
  await decide(admin, f, { outcome: "APPROVE", reason: "Demo approval.", applicantMessage: "Approved (demo only)." });
  const awardF = await createAward(admin, { applicationId: f, amount: "12000.00", currency: "EUR", acceptanceStatus: "PENDING", conditions: "Demo: acceptance of terms required before processing.", applicantSummary: "Fictional fixed award of EUR 12,000, three planned instalments.", internalNotes: "Awaiting acceptance (demo)." });
  await createDisbursement(admin, { awardId: awardF.id, amount: "4000.00", plannedDate: day(-10), milestone: "Kick-off (demo)", applicantNote: "Planned first instalment." });
  const f2 = await createDisbursement(admin, { awardId: awardF.id, amount: "4000.00", plannedDate: day(20), milestone: "Mid-point (demo)" });
  await changeDisbursementStatus(admin, f2.id, { to: "ON_HOLD", reason: "Held until the award terms are accepted (demo)." });
  // (remaining EUR 4,000 deliberately left unscheduled to demonstrate the balance display)
  // G: declined
  const g = await apply(casey, opp1, { amount: "1500.00", category: "ENTREPRENEUR" });
  await assignReviewer(admin, g, { reviewerId: rev2.id });
  await moveStatus(rev2, g, { to: "INITIAL_REVIEW" });
  await moveStatus(rev2, g, { to: "UNDER_REVIEW" });
  await recommend(rev2, g, { recommendation: "DECLINE", body: "Demo: does not meet criterion 2." });
  await decide(admin, g, { outcome: "DECLINE", reason: "Demo decline following reviewer recommendation.", applicantMessage: "Unfortunately your demo application was not successful." });
  // H: partially completed draft
  const h = await startOrResumeApplication(jordan, opp3.slug);
  await saveApplicationStep(jordan, h.id, 1, 3, { applicantCategory: "INDIVIDUAL" });
  await saveApplicationStep(jordan, h.id, 3, 4, { answers: { story: "Half-finished fictional draft…" } });
  // I: revision requested (and applicant has not yet resubmitted)
  const i = await apply(coop, opp3, { amount: "30000.00" });
  await assignReviewer(admin, i, { reviewerId: rev1.id });
  await moveStatus(rev1, i, { to: "INITIAL_REVIEW" });
  await requestRevision(rev1, i, { message: "Please expand the beneficiaries section with approximate numbers (demo request)." });
  // J: withdrawn
  const j = await apply(taylor, opp1, { amount: "1200.00" });
  await withdrawApplication(taylor, j, { reason: "Demo withdrawal." });
  // K: approved without an award yet
  const k = await apply(casey, opp3, { amount: "25000.00" , category: "INDIVIDUAL" });
  await assignReviewer(admin, k, { reviewerId: rev1.id });
  await moveStatus(rev1, k, { to: "INITIAL_REVIEW" });
  await moveStatus(rev1, k, { to: "UNDER_REVIEW" });
  await recommend(rev1, k, { recommendation: "APPROVE", body: "Demo: recommend approval." });
  await decide(admin, k, { outcome: "APPROVE", reason: "Demo approval; award record to follow.", applicantMessage: "Approved (demo). Award details will follow." });
  // an applicant reply to demonstrate the conversation
  void respondToInfoRequest;

  // ---- saved opportunities
  await toggleSaved(jordan.id, opp2.id);
  await toggleSaved(jordan.id, opp4.id);
  await toggleSaved(sam.id, opp3.id);

  // ---- support requests
  const s1 = await createSupportRequest({ name: "Visitor Demo", email: `visitor@${EMAIL_DOMAIN}`, topic: "Finding an opportunity", message: "Demo message: I am looking for training funding for a youth group. Where should I start?", consent: true }, null);
  const s2 = await createSupportRequest({ name: jordan.name, email: `individual1@${EMAIL_DOMAIN}`, topic: "My application", relatedRef: "NEN-DEMO-2026-ABCDEF", message: "Demo message: how do I resume my saved draft application?", consent: true }, jordan.id);
  const s3 = await createSupportRequest({ name: youth.name, email: `org3@${EMAIL_DOMAIN}`, topic: "Reporting a suspicious offer", message: "Demo message: someone messaged us asking for a fee to release funds. We have not paid anything.", consent: true }, youth.id);
  await updateSupportStatus(admin, s2.id, { status: "IN_PROGRESS", assignedToId: admin.id });
  await addSupportNote(admin, s2.id, { body: "Internal: user can resume from the dashboard; reply drafted.", isInternal: true });
  await addSupportNote(admin, s2.id, { body: "Hi Jordan — sign in, open your dashboard and choose “Continue” beside your draft. (Demo reply)", isInternal: false });
  await updateSupportStatus(admin, s3.id, { status: "RESOLVED", assignedToId: admin.id });
  await addSupportNote(admin, s3.id, { body: "Thanks for reporting this. Never pay to release funds — we will never ask. (Demo reply)", isInternal: false });
  void s1;

  console.log("Done. Demo accounts (all fictional, password from DEMO_SEED_PASSWORD or the README default):");
  for (const a of [admin, rev1, rev2, jordan, sam, taylor, casey, coop, farm, youth]) {
    const u = await db.user.findUniqueOrThrow({ where: { id: a.id } });
    console.log(`  ${u.role.padEnd(24)} ${u.email}`);
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.$disconnect());
