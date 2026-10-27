import { z } from "zod";
import { isCurrency, parseAmountToMinor } from "../money";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Enter your email address.")
  .max(254)
  .pipe(z.email("Enter a valid email address."));

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens only.");

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((c) => isCurrency(c), "Choose a supported currency.");

/** Optional free text -> trimmed string or undefined. */
export const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const optUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Enter a full web address starting with http:// or https://");

/** Date input (yyyy-mm-dd or ISO) -> Date; empty -> undefined. */
export const optDate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const d = new Date(v.length === 10 ? `${v}T00:00:00.000Z` : v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    return d;
  });

export const reqDate = z
  .string()
  .trim()
  .min(1, "Choose a date.")
  .transform((v, ctx) => {
    const d = new Date(v.length === 10 ? `${v}T00:00:00.000Z` : v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    return d;
  });

/** Amount text in a given currency -> minor units, through Zod so errors are field-level. */
export function amountField(currencyOf: () => string) {
  return z
    .string()
    .trim()
    .transform((v, ctx) => {
      const minor = parseAmountToMinor(v, currencyOf());
      if (minor === null || minor <= 0) {
        ctx.addIssue({ code: "custom", message: "Enter a positive amount with the correct number of decimals." });
        return z.NEVER;
      }
      return minor;
    });
}

export const linesToList = (v: string | undefined | null): string[] =>
  (v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
