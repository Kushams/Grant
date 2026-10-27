/** Shared domain constants. Statuses are validated strings (SQLite has no enums). */

export const ROLES = ["INDIVIDUAL_APPLICANT", "ORGANIZATION_APPLICANT", "REVIEWER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  INDIVIDUAL_APPLICANT: "Individual applicant",
  ORGANIZATION_APPLICANT: "Organization applicant",
  REVIEWER: "Reviewer",
  ADMIN: "Administrator",
};
export const isApplicantRole = (r: string): boolean => r === "INDIVIDUAL_APPLICANT" || r === "ORGANIZATION_APPLICANT";
export const isStaffRole = (r: string): boolean => r === "REVIEWER" || r === "ADMIN";

/** Self-registration is only allowed for applicant roles; staff accounts are created by admins/seed. */
export const REGISTRABLE_ROLES = ["INDIVIDUAL_APPLICANT", "ORGANIZATION_APPLICANT"] as const;

// ---- applicant types / categories -----------------------------------------
export const APPLICANT_TYPES = [
  "INDIVIDUAL",
  "ENTREPRENEUR",
  "SMALL_BUSINESS",
  "REGISTERED_BUSINESS",
  "NONPROFIT",
  "COMMUNITY_ORG",
  "OTHER_ENTITY",
] as const;
export type ApplicantType = (typeof APPLICANT_TYPES)[number];
export const APPLICANT_TYPE_LABELS: Record<ApplicantType, string> = {
  INDIVIDUAL: "Individual",
  ENTREPRENEUR: "Entrepreneur",
  SMALL_BUSINESS: "Small business",
  REGISTERED_BUSINESS: "Registered business",
  NONPROFIT: "Nonprofit organization",
  COMMUNITY_ORG: "Community organization",
  OTHER_ENTITY: "Other eligible entity",
};
export const INDIVIDUAL_CATEGORIES = ["INDIVIDUAL", "ENTREPRENEUR"] as const;
export const ORGANIZATION_TYPES = ["SMALL_BUSINESS", "REGISTERED_BUSINESS", "NONPROFIT", "COMMUNITY_ORG", "OTHER_ENTITY"] as const;
export type ApplicantMode = "INDIVIDUAL" | "ORGANIZATION";

export const PROGRAMME_CATEGORIES = [
  "Entrepreneurship & small business",
  "Education & skills",
  "Community development",
  "Health & wellbeing",
  "Agriculture & food security",
  "Technology & innovation",
  "Arts & culture",
  "Environment & climate",
] as const;

export const REGIONS = [
  "Global (all countries)",
  "Africa",
  "Asia-Pacific",
  "Europe",
  "Latin America & Caribbean",
  "Middle East & North Africa",
  "North America",
] as const;

// ---- currencies (controlled list; never assume USD) -------------------------
export const CURRENCIES = {
  USD: { name: "US dollar", decimals: 2 },
  EUR: { name: "Euro", decimals: 2 },
  GBP: { name: "Pound sterling", decimals: 2 },
  NGN: { name: "Nigerian naira", decimals: 2 },
  GHS: { name: "Ghanaian cedi", decimals: 2 },
  KES: { name: "Kenyan shilling", decimals: 2 },
  ZAR: { name: "South African rand", decimals: 2 },
  INR: { name: "Indian rupee", decimals: 2 },
  CAD: { name: "Canadian dollar", decimals: 2 },
  AUD: { name: "Australian dollar", decimals: 2 },
  JPY: { name: "Japanese yen", decimals: 0 },
} as const;
export type CurrencyCode = keyof typeof CURRENCIES;
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

// ---- opportunities ----------------------------------------------------------
export const OPPORTUNITY_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
export const CLASSIFICATIONS = ["DEMO", "LIVE"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export const QUESTION_TYPES = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "NUMBER",
  "DATE",
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "YES_NO",
  "URL",
  "SUPPORTING_INFO",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SHORT_TEXT: "Short text",
  LONG_TEXT: "Long text",
  NUMBER: "Number",
  DATE: "Date",
  SINGLE_CHOICE: "Single choice",
  MULTI_CHOICE: "Multiple choice",
  YES_NO: "Yes / no",
  URL: "Link (optional URL)",
  SUPPORTING_INFO: "Supporting information (non-sensitive)",
};
export const QUESTION_SECTIONS = ["GENERAL", "PROJECT", "SUPPORTING"] as const;
export type QuestionSection = (typeof QUESTION_SECTIONS)[number];

/** Optional project-proposal prompts an administrator can switch on per opportunity. */
export const PROJECT_PRESETS: Array<{ key: string; label: string; type: QuestionType; help: string }> = [
  { key: "purpose", label: "Purpose of the request", type: "LONG_TEXT", help: "What do you want to achieve?" },
  { key: "use_of_funds", label: "Intended use of funds or support", type: "LONG_TEXT", help: "Describe how any support would be used." },
  { key: "expected_outcomes", label: "Expected outcomes", type: "LONG_TEXT", help: "What would change as a result?" },
  { key: "beneficiaries", label: "Beneficiaries or intended audience", type: "LONG_TEXT", help: "Who benefits, and roughly how many?" },
  { key: "timeline", label: "Proposed timeline", type: "LONG_TEXT", help: "Key activities and dates." },
  { key: "budget_summary", label: "Budget summary", type: "LONG_TEXT", help: "A short, non-sensitive summary of costs." },
];

// ---- applications -----------------------------------------------------------
export const APPLICATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "INITIAL_REVIEW",
  "UNDER_REVIEW",
  "INFO_REQUESTED",
  "RESUBMISSION_REQUIRED",
  "RECOMMENDED",
  "APPROVED",
  "DECLINED",
  "WITHDRAWN",
  "AWARD_PROCESSING",
  "DISBURSEMENT_SCHEDULED",
  "PARTIALLY_DISBURSED",
  "FULLY_DISBURSED",
  "CLOSED",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  INITIAL_REVIEW: "Initial review",
  UNDER_REVIEW: "Under review",
  INFO_REQUESTED: "Additional information requested",
  RESUBMISSION_REQUIRED: "Resubmission required",
  RECOMMENDED: "Recommended for approval",
  APPROVED: "Approved",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
  AWARD_PROCESSING: "Award processing",
  DISBURSEMENT_SCHEDULED: "Disbursement scheduled",
  PARTIALLY_DISBURSED: "Partially disbursed",
  FULLY_DISBURSED: "Fully disbursed",
  CLOSED: "Closed",
};

/** Plain-language explanation shown to applicants for each status. */
export const STATUS_APPLICANT_EXPLANATION: Record<ApplicationStatus, string> = {
  DRAFT: "Your application is saved but has not been submitted. You can keep editing it.",
  SUBMITTED: "We have received your application and recorded your reference number. It is waiting to be picked up for review.",
  INITIAL_REVIEW: "Your application is being checked for completeness and basic eligibility.",
  UNDER_REVIEW: "A reviewer is assessing your application against the programme criteria.",
  INFO_REQUESTED: "The review team needs more information from you. Please reply from this page.",
  RESUBMISSION_REQUIRED: "Changes are needed before the review can continue. Edit your application and resubmit it.",
  RECOMMENDED: "The review stage is complete and a recommendation has been passed on for a final decision. This is not yet a decision.",
  APPROVED: "Your application was approved. Award terms (if any) will appear below once they have been recorded by staff.",
  DECLINED: "Your application was not successful for this programme.",
  WITHDRAWN: "This application was withdrawn.",
  AWARD_PROCESSING: "An award record is being prepared by staff. No payment has been made yet.",
  DISBURSEMENT_SCHEDULED: "A disbursement schedule has been recorded. Dates are plans, not guarantees of payment.",
  PARTIALLY_DISBURSED: "Staff have recorded that part of the award has been disbursed.",
  FULLY_DISBURSED: "Staff have recorded that the full award has been disbursed.",
  CLOSED: "This application is closed.",
};

/** Only withdrawing frees the applicant's single slot (programmes that forbid duplicates). */
export const TERMINAL_FOR_ACTIVE_KEY: ApplicationStatus[] = ["WITHDRAWN"];
/** Statuses in which the applicant may edit their answers. */
export const APPLICANT_EDITABLE: ApplicationStatus[] = ["DRAFT", "RESUBMISSION_REQUIRED"];

// ---- awards / disbursements ---------------------------------------------------
export const AWARD_STATUSES = ["ACTIVE", "ON_HOLD", "CANCELLED", "COMPLETED"] as const;
export const AWARD_ACCEPTANCE = ["NOT_REQUIRED", "PENDING", "ACCEPTED", "DECLINED"] as const;
export const AWARD_TYPES = ["Grant (cash)", "In-kind support", "Mentorship / training", "Voucher / credit", "Other (to be configured)"] as const;

export const DISBURSEMENT_STATUSES = [
  "NOT_SCHEDULED",
  "SCHEDULED",
  "AWAITING_PROCESSING",
  "PROCESSING_RECORDED",
  "PAID_MANUAL",
  "ON_HOLD",
  "CANCELLED",
  "FAILED_MANUAL",
  "RECONCILED",
] as const;
export type DisbursementStatus = (typeof DISBURSEMENT_STATUSES)[number];
export const DISBURSEMENT_LABELS: Record<DisbursementStatus, string> = {
  NOT_SCHEDULED: "Not scheduled",
  SCHEDULED: "Scheduled",
  AWAITING_PROCESSING: "Awaiting authorized processing",
  PROCESSING_RECORDED: "Processing recorded",
  PAID_MANUAL: "Paid — manually recorded",
  ON_HOLD: "On hold",
  CANCELLED: "Cancelled",
  FAILED_MANUAL: "Failed — manually recorded",
  RECONCILED: "Reconciled",
};
/** Statuses that count towards "recorded as paid" totals (still manual, never provider-verified). */
export const PAID_RECORDED: DisbursementStatus[] = ["PAID_MANUAL", "RECONCILED"];
/** Statuses excluded from the "scheduled amount" so cancelled plans free up balance. */
export const NON_COUNTING: DisbursementStatus[] = ["CANCELLED", "FAILED_MANUAL", "NOT_SCHEDULED"];

// ---- support ------------------------------------------------------------------
export const SUPPORT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
export const SUPPORT_TOPICS = [
  "Finding an opportunity",
  "My application",
  "Account or profile",
  "Reporting a suspicious offer",
  "Accessibility",
  "Privacy and my data",
  "Something else",
] as const;
