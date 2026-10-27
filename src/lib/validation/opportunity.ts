import { z } from "zod";
import {
  APPLICANT_TYPES,
  AWARD_TYPES,
  CLASSIFICATIONS,
  PROGRAMME_CATEGORIES,
  QUESTION_SECTIONS,
  QUESTION_TYPES,
} from "../constants";
import { parseAmountToMinor } from "../money";
import { currencySchema, optDate, optText, slugSchema } from "./common";

export const questionSchema = z
  .object({
    key: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(40)
      .regex(/^[a-z][a-z0-9_]*$/, "Question keys use lowercase letters, numbers and underscores."),
    label: z.string().trim().min(3, "Each question needs a label.").max(200),
    helpText: z.string().trim().max(300).optional().transform((v) => v || undefined),
    type: z.enum(QUESTION_TYPES),
    options: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    required: z.boolean().default(false),
    section: z.enum(QUESTION_SECTIONS).default("GENERAL"),
  })
  .refine((q) => !["SINGLE_CHOICE", "MULTI_CHOICE"].includes(q.type) || q.options.length >= 2, {
    path: ["options"],
    message: "Choice questions need at least two options.",
  });
export type QuestionInput = z.infer<typeof questionSchema>;

const faqItem = z.object({ q: z.string().trim().min(3).max(200), a: z.string().trim().min(3).max(1500) });

const amountText = z.string().trim().optional();

export const opportunitySchema = z
  .object({
    title: z.string().trim().min(5, "Give the opportunity a descriptive title.").max(160),
    slug: slugSchema.optional(),
    shortDescription: z.string().trim().min(10, "Add a one- or two-sentence summary.").max(300),
    description: z.string().trim().min(20, "Add a fuller description.").max(8000),
    category: z.enum(PROGRAMME_CATEGORIES, { error: "Choose a category." }),
    applicantTypes: z.array(z.enum(APPLICANT_TYPES)).default([]),
    eligibleRegions: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    keywords: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    fundingSpecified: z.boolean().default(false),
    currency: currencySchema.default("USD"),
    minAmount: amountText,
    maxAmount: amountText,
    fixedAmount: amountText,
    awardType: z.enum(AWARD_TYPES).optional(),
    fundingPurpose: optText(1000),
    fundingTerms: optText(2000),
    plannedInstallments: z.coerce.number().int().min(1).max(60).optional().or(z.literal("").transform(() => undefined)),
    installmentPlan: optText(1000),
    milestones: optText(1500),
    paymentSchedule: optText(1000),
    disbursementConditions: optText(1500),
    eligibilityCriteria: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
    requiredInformation: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
    requiredDocuments: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
    opensAt: optDate,
    deadline: optDate,
    selectionProcess: optText(2000),
    decisionTimeline: optText(500),
    programmeTerms: optText(6000),
    termsApproved: z.boolean().default(false),
    funderName: optText(160),
    funderVerified: z.boolean().default(false),
    faq: z.array(faqItem).max(15).default([]),
    allowMultipleApplications: z.boolean().default(false),
    requireProposal: z.boolean().default(false),
    feePolicyNote: optText(1000),
    questions: z.array(questionSchema).max(40).default([]),
  })
  .superRefine((v, ctx) => {
    const keys = new Set<string>();
    v.questions.forEach((q, i) => {
      if (keys.has(q.key)) ctx.addIssue({ code: "custom", path: ["questions", i, "key"], message: `Duplicate question key "${q.key}".` });
      keys.add(q.key);
    });
    if (v.opensAt && v.deadline && v.deadline.getTime() <= v.opensAt.getTime()) {
      ctx.addIssue({ code: "custom", path: ["deadline"], message: "The deadline must be after the opening date." });
    }
    if (v.fundingSpecified) {
      const min = v.minAmount ? parseAmountToMinor(v.minAmount, v.currency) : null;
      const max = v.maxAmount ? parseAmountToMinor(v.maxAmount, v.currency) : null;
      const fixed = v.fixedAmount ? parseAmountToMinor(v.fixedAmount, v.currency) : null;
      for (const [name, text, parsed] of [
        ["minAmount", v.minAmount, min],
        ["maxAmount", v.maxAmount, max],
        ["fixedAmount", v.fixedAmount, fixed],
      ] as const) {
        if (text && (parsed === null || parsed <= 0)) {
          ctx.addIssue({ code: "custom", path: [name], message: "Enter a positive amount with the correct number of decimals." });
        }
      }
      if (fixed && (min || max)) {
        ctx.addIssue({ code: "custom", path: ["fixedAmount"], message: "Use either a fixed amount OR a minimum/maximum range, not both." });
      }
      if (!fixed && !min && !max) {
        ctx.addIssue({ code: "custom", path: ["fixedAmount"], message: "Funding is marked as specified, so enter a fixed amount or a range." });
      }
      if (min && max && min > max) {
        ctx.addIssue({ code: "custom", path: ["minAmount"], message: "The minimum cannot exceed the maximum." });
      }
    }
  });
export type OpportunityInput = z.infer<typeof opportunitySchema>;

export const verifyLiveSchema = z.object({
  confirm: z.literal(true, { error: "Tick the box to confirm that every detail and the programme terms have been verified." }),
  note: z.string().trim().min(10, "Describe how and by whom the details were verified.").max(1000),
});
