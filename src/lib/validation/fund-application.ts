import { z } from "zod";
import { FUND_APPLICATION_STATUSES, FUND_APPLICANT_TYPES } from "../constants";
import { parseAmountToMinor } from "../money";
import { GENERAL_FUND_RANGE } from "@/config/general-fund";
import { emailSchema, optText } from "./common";

/**
 * The SHORT public application form for the General Opportunity Fund, exactly as the
 * organization approved it (see HANDOFF.md §3): name, contact details, country,
 * applicant type, story (optional), purpose, use of funds, amount requested inside
 * the published range, a short budget, a conflict-of-interest declaration and
 * privacy consent. There are deliberately NO fields for SSN, ID documents, date or
 * place of birth, marital status, income, or bank/card details, and no fee of any
 * kind is requested. Do not add such fields here.
 */

/** African sovereign states (UN member list) + common name variants, lower-cased. */
export const AFRICAN_COUNTRIES = new Set(
  [
    "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cape Verde",
    "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo", "Republic of the Congo",
    "Democratic Republic of the Congo", "DR Congo", "Côte d'Ivoire", "Cote d'Ivoire", "Ivory Coast",
    "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Swaziland", "Ethiopia", "Gabon",
    "Gambia", "The Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya",
    "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
    "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "São Tomé and Príncipe", "Senegal",
    "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania",
    "United Republic of Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
  ].map((c) => c.toLowerCase()),
);

/** Screening aid only: exact country-name match. Staff make the final eligibility call. */
export function isAfricanCountry(country: string): boolean {
  return AFRICAN_COUNTRIES.has(country.trim().toLowerCase());
}

const MIN_MINOR = parseAmountToMinor(GENERAL_FUND_RANGE.min, GENERAL_FUND_RANGE.currency) ?? 0;
const MAX_MINOR = parseAmountToMinor(GENERAL_FUND_RANGE.max, GENERAL_FUND_RANGE.currency) ?? 0;

export const fundApplicationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(120),
    email: emailSchema,
    phone: optText(30).refine((v) => !v || /^[+\d][\d\s().-]{6,}$/.test(v), "Enter a valid phone number, or leave this blank."),
    country: z.string().trim().min(2, "Enter the country you are located in.").max(100),
    applicantType: z.enum(FUND_APPLICANT_TYPES, { error: "Choose the type that best describes you." }),
    story: optText(2000),
    purpose: z.string().trim().min(10, "Tell us what the funding is for (at least a sentence).").max(3000),
    useOfFunds: z.string().trim().min(10, "Tell us how the money would be used (at least a sentence).").max(3000),
    amountRequested: z.string().trim().transform((v, ctx) => {
      const minor = parseAmountToMinor(v, GENERAL_FUND_RANGE.currency);
      if (minor === null || minor <= 0) {
        ctx.addIssue({ code: "custom", message: "Enter the amount you are requesting, for example 50000." });
        return z.NEVER;
      }
      if (minor < MIN_MINOR || minor > MAX_MINOR) {
        ctx.addIssue({
          code: "custom",
          message: `Requests must be between $${Number(GENERAL_FUND_RANGE.min).toLocaleString("en-US")} and $${Number(GENERAL_FUND_RANGE.max).toLocaleString("en-US")}.`,
        });
        return z.NEVER;
      }
      return minor;
    }),
    budgetSummary: z.string().trim().min(10, "Give a short budget summary (at least a sentence).").max(3000),
    hasConflict: z.boolean(),
    conflictDetails: optText(1000),
    consent: z.literal(true, { error: "Please acknowledge the draft privacy notice." }),
    website: z.string().max(500).optional(), // honeypot: real people leave this empty (checked in the service)
  })
  .superRefine((v, ctx) => {
    if (isAfricanCountry(v.country)) {
      ctx.addIssue({ code: "custom", path: ["country"], message: "The General Opportunity Fund is open worldwide except to applicants located in Africa, so we cannot accept an application from that location." });
    }
    if (v.hasConflict && !v.conflictDetails) {
      ctx.addIssue({ code: "custom", path: ["conflictDetails"], message: "Please describe the relationship." });
    }
  });

export const fundApplicationStatusSchema = z.object({
  status: z.enum(FUND_APPLICATION_STATUSES),
});
export const fundApplicationNoteSchema = z.object({
  body: z.string().trim().min(2, "Write a note.").max(3000),
});
