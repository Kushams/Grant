import { z } from "zod";
import { emailSchema } from "./common";
import { ORGANIZATION_TYPES, REGISTRABLE_ROLES } from "../constants";

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use at most 128 characters.")
  .refine((p) => /[a-z]/i.test(p) && /\d/.test(p), "Include at least one letter and one number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
  next: z.string().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    accountType: z.enum(REGISTRABLE_ROLES, { error: "Choose an account type." }),
    organizationName: z.string().trim().max(160).optional(),
    organizationType: z.enum(ORGANIZATION_TYPES).optional(),
    consentPrivacy: z.literal(true, { error: "You need to acknowledge the draft privacy notice to register." }),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." })
  .refine((v) => v.accountType !== "ORGANIZATION_APPLICANT" || (v.organizationName && v.organizationName.length >= 2), {
    path: ["organizationName"],
    message: "Enter your organization's name.",
  })
  .refine((v) => v.accountType !== "ORGANIZATION_APPLICANT" || !!v.organizationType, {
    path: ["organizationType"],
    message: "Choose an organization type.",
  });

export const staffUserSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(120),
  email: emailSchema,
  role: z.enum(["REVIEWER", "ADMIN"], { error: "Choose a staff role." }),
  password: passwordSchema,
});
