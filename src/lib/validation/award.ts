import { z } from "zod";
import { AWARD_ACCEPTANCE, AWARD_STATUSES, DISBURSEMENT_STATUSES } from "../constants";
import { currencySchema, reqDate } from "./common";

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);

export const createAwardSchema = z.object({
  applicationId: z.string().min(1),
  amount: z.string().trim().min(1, "Enter the approved amount."),
  currency: currencySchema,
  acceptanceStatus: z.enum(AWARD_ACCEPTANCE).default("NOT_REQUIRED"),
  conditions: opt(3000),
  applicantSummary: opt(2000),
  internalNotes: opt(3000),
});

export const updateAwardSchema = z.object({
  status: z.enum(AWARD_STATUSES),
  acceptanceStatus: z.enum(AWARD_ACCEPTANCE),
  conditions: opt(3000),
  applicantSummary: opt(2000),
  internalNotes: opt(3000),
  reason: z.string().trim().min(5, "Record a reason for this change.").max(1000),
});

export const changeAwardAmountSchema = z.object({
  amount: z.string().trim().min(1, "Enter the new amount."),
  reason: z.string().trim().min(10, "Record a reason for changing the approved amount.").max(1000),
});

export const createDisbursementSchema = z.object({
  awardId: z.string().min(1),
  amount: z.string().trim().min(1, "Enter the planned amount."),
  plannedDate: reqDate,
  milestone: opt(300),
  applicantNote: opt(1000),
  internalNotes: opt(2000),
});

export const updateDisbursementSchema = z.object({
  amount: z.string().trim().min(1, "Enter the planned amount."),
  plannedDate: reqDate,
  milestone: opt(300),
  applicantNote: opt(1000),
  internalNotes: opt(2000),
  reason: z.string().trim().min(5, "Record a reason for this change.").max(1000),
});

export const changeDisbursementStatusSchema = z.object({
  to: z.enum(DISBURSEMENT_STATUSES),
  reason: z.string().trim().min(5, "Record a reason or external reference for this change.").max(1000),
  acknowledgeManual: z.boolean().default(false),
});
