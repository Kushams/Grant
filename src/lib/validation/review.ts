import { z } from "zod";

const reason = (min = 5) => z.string().trim().min(min, "Please give a reason.").max(2000);

export const noteSchema = z.object({ body: z.string().trim().min(3, "Write a note.").max(4000) });
export const infoRequestSchema = z.object({ message: reason(10) });
export const recommendSchema = z.object({
  recommendation: z.enum(["APPROVE", "DECLINE"], { error: "Choose a recommendation." }),
  body: reason(10),
});
export const decisionSchema = z.object({
  outcome: z.enum(["APPROVE", "DECLINE"], { error: "Choose an outcome." }),
  reason: reason(10),
  internalNotes: z.string().trim().max(3000).optional().transform((v) => v || undefined),
  applicantMessage: z.string().trim().max(3000).optional().transform((v) => v || undefined),
});
export const moveStatusSchema = z.object({
  to: z.string().min(1),
  note: z.string().trim().max(2000).optional().transform((v) => v || undefined),
});
export const assignSchema = z.object({ reviewerId: z.string().min(1, "Choose a reviewer.") });
