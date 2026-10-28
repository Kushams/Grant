/**
 * Draft definition of the General Opportunity Fund as an opportunity record.
 *
 * It is created as a LIVE *draft* and cannot be published until an administrator completes the LIVE verification
 * checklist in the admin area (funder named and verified, terms approved, dates, disbursement structure).
 * Nothing here asserts that funding exists. Applicants REQUEST an amount inside the range with a budget; the Board
 * may approve a different amount (see the policy). The questions below are placeholders until the organization's
 * own application list replaces them in the opportunity editor.
 */
/** Public opening date for applications (set by the organization). */
export const GENERAL_FUND_OPENS = "2026-11-01";
export const GENERAL_FUND_SLUG = "general-opportunity-fund";
export const fundOpensLabel = () => new Date(`${GENERAL_FUND_OPENS}T00:00:00Z`).toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" });

export const fundHasOpened = (now: number = Date.now()) => now >= new Date(`${GENERAL_FUND_OPENS}T00:00:00Z`).getTime();

export const GENERAL_FUND_RANGE = { min: "25000.00", max: "500000.00", currency: "USD" } as const;

export const GENERAL_FUND_INPUT = {
  title: "General Opportunity Fund",
  slug: GENERAL_FUND_SLUG,
  opensAt: GENERAL_FUND_OPENS,
  shortDescription: "A broad pathway for eligible individuals, entrepreneurs, creatives, community groups and organizations whose goals may not fit a specialized funding category.",
  description:
    "The General Opportunity Fund expands access to funding for people, ideas and initiatives with the potential to create meaningful personal, professional, economic and community impact.\n\n" +
    "Applicants describe what they need, request an amount within the programme range and explain, with a budget, how it would be used. Each eligible request is reviewed individually against published criteria. " +
    "The final decision, including the amount, is made by the Board of Directors and may differ from the amount requested.",
  category: "General opportunity",
  applicantTypes: ["INDIVIDUAL", "ENTREPRENEUR", "SMALL_BUSINESS", "NONPROFIT", "COMMUNITY_ORG"],
  eligibleRegions: ["Global (all countries)"],
  keywords: ["general", "individuals", "entrepreneurs", "community"],
  fundingSpecified: true,
  currency: GENERAL_FUND_RANGE.currency,
  minAmount: GENERAL_FUND_RANGE.min,
  maxAmount: GENERAL_FUND_RANGE.max,
  awardType: "Grant (cash)",
  eligibilityCriteria: [
    "Submit a complete application using the designated process.",
    "Explain the purpose of the request and the need or benefit it addresses.",
    "Provide a realistic budget and explain how funds would be used.",
    "Agree to the award terms and reporting obligations if an award is made.",
    "Disclose any relationship with the organization's directors, officers, staff or reviewers.",
    "Be located outside Africa: the fund is open worldwide except to applicants located in Africa.",
  ],
  funderName: "National Empowerment Network, LLC",
  paymentSchedule: "Approved awards are paid by cheque to the approved recipient after the recipient accepts the written award terms.",
  disbursementConditions: "Written award terms accepted by the recipient; identity confirmed through a secure process before payment.",
  programmeTerms:
    "1. Applying is free. NEN never charges a fee to apply or to receive an award.\n" +
    "2. An application is a request, not a promise. The Board of Directors may approve the amount requested, a different amount, or decline.\n" +
    "3. An award exists only after written approval and the recipient's acceptance of the written award terms.\n" +
    "4. Approved awards are paid by cheque to the approved recipient. Another method is used only if stated in the award terms and lawful.\n" +
    "5. Funds may be used only for the approved purpose. Changes need written approval. Recipients may be asked for a short report on use of funds.\n" +
    "6. Awards may be withdrawn, and repayment requested, if funds are misused or an application contained false information.\n" +
    "7. The fund is open worldwide except to applicants located in Africa, and subject to law, sanctions and banking rules.",
  requiredInformation: ["Purpose of the request", "Amount requested and budget summary"],
  requiredDocuments: [],
  selectionProcess:
    "Applications are screened for completeness and eligibility, reviewed against published criteria (need, impact, feasibility, budget, accountability) and decided by the Board of Directors, which records the reason.",
  questions: [
    { key: "story", label: "Tell us about yourself or your organization", helpText: "A few sentences.", type: "LONG_TEXT", required: false, section: "GENERAL", options: [] },
    { key: "conflict_of_interest", label: "Do you have a relationship with a NEN director, officer, staff member or reviewer?", type: "SINGLE_CHOICE", required: true, section: "GENERAL", options: ["No", "Yes"] },
    { key: "conflict_details", label: "If yes, please describe the relationship", type: "SHORT_TEXT", required: false, section: "GENERAL", options: [] },
    { key: "purpose", label: "What is the funding for?", helpText: "What do you want to achieve?", type: "LONG_TEXT", required: true, section: "PROJECT", options: [] },
    { key: "use_of_funds", label: "How would the money be used?", type: "LONG_TEXT", required: true, section: "PROJECT", options: [] },
    { key: "budget_summary", label: "Budget summary", helpText: "A short summary of costs that adds up to the amount requested. No bank or ID details.", type: "LONG_TEXT", required: true, section: "PROJECT", options: [] },
  ],
} as const;
