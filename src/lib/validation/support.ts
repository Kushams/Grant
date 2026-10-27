import { z } from "zod";
import { SUPPORT_STATUSES, SUPPORT_TOPICS } from "../constants";
import { emailSchema } from "./common";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: emailSchema,
  topic: z.enum(SUPPORT_TOPICS, { error: "Choose a topic." }),
  relatedRef: z
    .string()
    .trim()
    .toUpperCase()
    .max(40)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || /^NEN-[A-Z0-9-]{6,36}$/.test(v), "Use a reference like NEN-DEMO-2026-ABC234, or leave this blank."),
  message: z.string().trim().min(10, "Please write at least a sentence.").max(4000),
  consent: z.literal(true, { error: "Please acknowledge the draft privacy notice." }),
  website: z.string().max(500).optional(), // honeypot: real people leave this empty (checked in the service)
});

export const supportStatusSchema = z.object({
  status: z.enum(SUPPORT_STATUSES),
  assignedToId: z.string().optional().transform((v) => v || undefined),
});
export const supportNoteSchema = z.object({
  body: z.string().trim().min(2, "Write a note.").max(3000),
  isInternal: z.boolean().default(true),
});
