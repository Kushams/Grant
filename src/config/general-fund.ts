/**
 * Draft definition of the General Opportunity Fund as an opportunity record.
 *
 * It is created as a LIVE *draft* and cannot be published until an administrator completes the LIVE verification
 * checklist in the admin area (funder named and verified, terms approved, dates, disbursement structure).
 * Nothing here asserts that funding exists. Applicants REQUEST an amount inside the range with a budget; the Board
 * may approve a different amount (see the policy). The questions below are placeholders until the organization's
 * own application list replaces them in the opportunity editor.
 */
export const GENERAL_FUND_RANGE = { min: "25000.00", max: "500000.00", currency: "USD" } as const;

export const GENERAL_FUND_INPUT = {
  title: "General Opportunity Fund",
  slug: "general-opportunity-fund",
  shortDescription: "A broad pathway for eligible individuals, entrepreneurs, creatives, community groups and organizations whose goals may not fit a specialized funding category.",
  description:
    "The General Opportunity Fund expands access to funding for people, ideas and initiatives with the potential to create meaningful personal, professional, economic and community impact.\n\n" +
    "Applicants describe what they need, request an amount within the programme range and explain, with a budget, how it would be used. Each eligible request is reviewed individually against published criteria. " +
    "The final decision, including the amount, is made by the Board of Directors and may differ from the amount requested.",
  category: "General opportunity",
  applicantTypes: ["INDIVIDUAL", "ENTREPRENEUR", "SMALL_BUSINESS", "NONPROFIT", "COMMUNITY_ORG"],
  eligibleRegions: [],
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
  ],
  requiredInformation: ["Purpose of the request", "Amount requested and budget summary"],
  requiredDocuments: [],
  selectionProcess:
    "Applications are screened for completeness and eligibility, reviewed against published criteria (need, impact, feasibility, budget, accountability) and decided by the Board of Directors, which records the reason.",
  questions: [
    { key: "story", label: "Tell us about yourself or your organization", type: "LONG_TEXT", required: true, section: "GENERAL", options: [] },
    { key: "purpose", label: "Purpose of the request", helpText: "What do you want to achieve?", type: "LONG_TEXT", required: true, section: "PROJECT", options: [] },
    { key: "use_of_funds", label: "Intended use of funds", helpText: "Describe how the money would be used.", type: "LONG_TEXT", required: true, section: "PROJECT", options: [] },
    { key: "budget_summary", label: "Budget summary", helpText: "A short, non-sensitive summary of costs that adds up to the amount requested.", type: "LONG_TEXT", required: true, section: "PROJECT", options: [] },
    { key: "expected_outcomes", label: "Expected outcomes", type: "LONG_TEXT", required: false, section: "PROJECT", options: [] },
    { key: "timeline", label: "Proposed timeline", type: "LONG_TEXT", required: false, section: "PROJECT", options: [] },
  ],
} as const;
