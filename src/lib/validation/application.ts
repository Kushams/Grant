import { z } from "zod";
import type { QuestionType } from "../constants";

export type QuestionLike = {
  key: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
  section: string;
};

/** A stored answer value is a string; MULTI_CHOICE is a JSON array string. */
export function normalizeAnswer(raw: unknown): string {
  if (Array.isArray(raw)) return JSON.stringify(raw.map(String));
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

/**
 * Validate ONE answer against its question definition. `strict` additionally enforces
 * `required` (used at submission time); drafts only type-check non-empty values.
 */
export function validateAnswer(q: QuestionLike, value: string, strict: boolean): string | null {
  const empty = value === "" || value === "[]";
  if (empty) return strict && q.required ? "This question is required." : null;
  const type = q.type as QuestionType;
  switch (type) {
    case "SHORT_TEXT":
      return value.length > 300 ? "Keep this under 300 characters." : null;
    case "LONG_TEXT":
    case "SUPPORTING_INFO":
      return value.length > 4000 ? "Keep this under 4,000 characters." : null;
    case "NUMBER":
      return /^-?\d{1,15}(\.\d{1,6})?$/.test(value) ? null : "Enter a number.";
    case "DATE":
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime()) ? null : "Enter a valid date.";
    case "YES_NO":
      return value === "YES" || value === "NO" ? null : "Choose yes or no.";
    case "SINGLE_CHOICE":
      return q.options.includes(value) ? null : "Choose one of the listed options.";
    case "MULTI_CHOICE": {
      try {
        const arr = JSON.parse(value);
        if (!Array.isArray(arr) || arr.some((x) => typeof x !== "string" || !q.options.includes(x))) return "Choose from the listed options.";
        return null;
      } catch {
        return "Choose from the listed options.";
      }
    }
    case "URL":
      return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(value) && value.length <= 300 ? null : "Enter a full web address starting with http:// or https://";
    default:
      return "Unsupported question type.";
  }
}

export const stepOneSchema = z.object({
  applicantCategory: z.string().min(1, "Choose how you are applying."),
  organizationId: z.string().optional(),
});

export const submitSchema = z.object({
  consentAccepted: z.literal(true, { error: "You must confirm the statements below before submitting." }),
  consentTerms: z.literal(true, { error: "Please confirm you have read the programme terms." }),
});

export const withdrawSchema = z.object({ reason: z.string().trim().max(500).optional() });
export const applicantReplySchema = z.object({ body: z.string().trim().min(3, "Write a reply.").max(3000) });

/**
 * Builds a Zod schema for the `answers` object of a set of questions. It type-checks every
 * non-empty value (never enforces `required` — drafts are lenient). Used by the client form
 * resolver for instant feedback; the server runs the same `validateAnswer` rules authoritatively.
 */
export function buildAnswersSchema(questions: QuestionLike[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const q of questions) {
    shape[q.key] = z
      .union([z.string(), z.array(z.string())])
      .optional()
      .superRefine((raw, ctx) => {
        const err = validateAnswer(q, normalizeAnswer(raw ?? ""), false);
        if (err) ctx.addIssue({ code: "custom", message: err });
      });
  }
  return z.object({
    answers: z.object(shape).partial(),
    requestedAmount: z.string().optional(),
    category: z.string().optional(),
    organizationId: z.string().optional(),
    consentAccepted: z.boolean().optional(),
    consentTerms: z.boolean().optional(),
  });
}
