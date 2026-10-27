/**
 * Central, replaceable organization facts for National Empowerment Network (NEN).
 *
 * RULE: anything that is not yet verified is `null` — never invent it. UI code must
 * render `null` as "To be confirmed" (see <Unconfirmed />) and the admin
 * Configuration checklist (/admin/configuration) lists every null so the team can
 * see what still needs sign-off before any real programme or public launch.
 */

export const ORG = {
  name: "National Empowerment Network",
  abbreviation: "NEN",
  tagline: "Discover Opportunities. Build Your Future.",
  description:
    "An independent empowerment and opportunity-access platform that helps individuals, entrepreneurs, businesses and organizations discover programmes, understand eligibility and track their applications.",
  // Short mission statement is PROPOSED copy for review, not an approved statement.
  missionDraft:
    "To make empowerment programmes and funding opportunities easier to find, easier to understand and fairer to apply for — with clear rules, honest status tracking and no hidden costs.",
  referencePrefix: "NEN",
  /** Policy documents are drafts until the organization approves them. */
  policyVersion: "DRAFT-0.1 (prototype — not approved)",
} as const;

/** Facts that need to be supplied/approved by the organization. `null` = unconfirmed. */
export const UNCONFIRMED_FACTS: Array<{
  key: string;
  label: string;
  value: string | null;
  why: string;
}> = [
  { key: "legalEntityName", label: "Registered legal entity name", value: null, why: "Required for Terms, Privacy and any agreement." },
  { key: "registrationNumber", label: "Company / registration number", value: null, why: "Never shown until supplied and verified." },
  { key: "registeredAddress", label: "Registered address / office locations", value: null, why: "No addresses are invented." },
  { key: "officialEmail", label: "Official contact email", value: null, why: "Contact form is stored in-app only until this is set." },
  { key: "officialPhone", label: "Official phone number", value: null, why: "No phone number is published until confirmed." },
  { key: "privacyContact", label: "Privacy / data-protection contact", value: null, why: "Needed for the approved Privacy Notice." },
  { key: "governingLaw", label: "Governing law and jurisdiction", value: null, why: "Needs legal review for the Terms." },
  { key: "ngoPartner", label: "NGO partner organization(s)", value: null, why: "Partnerships are listed only when confirmed in writing." },
  { key: "fundingPartners", label: "Verified funding partners", value: null, why: "No partner is named or implied until verified." },
  { key: "geographicCoverage", label: "Geographic coverage", value: null, why: "Eligible regions are set per verified programme." },
  { key: "feePolicy", label: "Application / service fee policy", value: null, why: "Fees are disabled. Any fee needs documented legal/compliance approval." },
  { key: "paymentProcess", label: "Approved disbursement process", value: null, why: "The prototype records, but never executes, payments." },
  { key: "approvedPolicies", label: "Approved Privacy, Terms, Accessibility & Fraud policies", value: null, why: "All policy pages are drafts for review." },
  { key: "branding", label: "Final logo and brand assets", value: null, why: "Prototype uses a neutral typographic mark." },
];

export const DEMO_LABEL = "DEMO — NOT A LIVE FUNDING OPPORTUNITY";
export const NO_FEE_STATEMENT =
  "Any applicable charges, if any, will be stated in the verified programme terms before you proceed.";
export const NO_GUARANTEE_STATEMENT =
  "Applying does not guarantee approval, funding or payment.";
export const PROTOTYPE_NOTICE =
  "Prototype: no real funding, payments, emails or SMS are processed by this site.";

export const PRIMARY_NAV = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/eligibility", label: "Eligibility" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export type NavItem = { href: string; label: string; children?: Array<{ href: string; label: string; hint?: string }> };
/** Header navigation. "Resources" is a dropdown; every entry maps to an existing route. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  {
    href: "/faq", label: "Resources",
    children: [
      { href: "/eligibility", label: "Eligibility guide", hint: "Who can apply to what" },
      { href: "/faq", label: "FAQ", hint: "Straight answers" },
      { href: "/fraud-prevention", label: "Fraud prevention", hint: "Stay safe" },
      { href: "/accessibility", label: "Accessibility", hint: "Our commitments" },
    ],
  },
  { href: "/contact", label: "Contact" },
];

export const HERO = {
  eyebrow: "NATIONAL EMPOWERMENT NETWORK",
  headline: "Opportunity starts here.",
  body: "Discover opportunities, understand eligibility, and navigate a clearer path from application to outcome.",
} as const;

export const FOOTER_LEGAL = [
  { href: "/privacy", label: "Privacy (draft)" },
  { href: "/terms", label: "Terms (draft)" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/fraud-prevention", label: "Fraud prevention" },
  { href: "/contact", label: "Contact" },
];
