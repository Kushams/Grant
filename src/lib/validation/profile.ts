import { z } from "zod";
import { INDIVIDUAL_CATEGORIES, ORGANIZATION_TYPES, PROGRAMME_CATEGORIES } from "../constants";
import { optText, optUrl, emailSchema } from "./common";

const phone = z
  .string()
  .trim()
  .max(30)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^[+()\d\s.-]{6,30}$/.test(v), "Enter a valid phone number or leave it blank.");

const interests = z
  .array(z.enum(PROGRAMME_CATEGORIES))
  .default([]);

export const individualProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  country: z.string().trim().min(2, "Enter your country or region.").max(80),
  city: optText(80),
  phone,
  applicantCategory: z.enum(INDIVIDUAL_CATEGORIES, { error: "Choose a category." }),
  background: optText(1500),
  interests,
});

export const organizationProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter the organization's name.").max(160),
  type: z.enum(ORGANIZATION_TYPES, { error: "Choose an organization type." }),
  country: z.string().trim().min(2, "Enter the country or region.").max(80),
  city: optText(80),
  contactEmail: emailSchema,
  phone,
  website: optUrl,
  description: optText(1500),
  sectors: interests,
});

export type IndividualProfileInput = z.infer<typeof individualProfileSchema>;
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;

/** Fields that make a profile "complete" for the purposes of the completion meter. */
export function individualCompletion(p: Partial<Record<string, unknown>> | null | undefined): { percent: number; missing: string[] } {
  const checks: Array<[string, boolean]> = [
    ["Full name", !!p?.fullName],
    ["Country or region", !!p?.country],
    ["City or locality", !!p?.city],
    ["Applicant category", !!p?.applicantCategory],
    ["Background or experience", !!p?.background],
    ["Areas of interest", Array.isArray(p?.interests) ? (p!.interests as unknown[]).length > 0 : false],
  ];
  return summarize(checks);
}
export function organizationCompletion(p: Partial<Record<string, unknown>> | null | undefined): { percent: number; missing: string[] } {
  const checks: Array<[string, boolean]> = [
    ["Organization name", !!p?.name],
    ["Organization type", !!p?.type],
    ["Country or region", !!p?.country],
    ["City or locality", !!p?.city],
    ["Public contact email", !!p?.contactEmail],
    ["Description", !!p?.description],
    ["Sector interests", Array.isArray(p?.sectors) ? (p!.sectors as unknown[]).length > 0 : false],
  ];
  return summarize(checks);
}
function summarize(checks: Array<[string, boolean]>) {
  const done = checks.filter(([, ok]) => ok).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([l]) => l) };
}

/** Minimum needed to start an application (a subset of the completion checks). */
export function isIndividualApplyReady(p: { fullName?: string | null; country?: string | null } | null | undefined): boolean {
  return !!p?.fullName && !!p?.country;
}
export function isOrganizationApplyReady(p: { name?: string | null; country?: string | null; contactEmail?: string | null } | null | undefined): boolean {
  return !!p?.name && !!p?.country && !!p?.contactEmail;
}
