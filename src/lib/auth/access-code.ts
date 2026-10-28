/** Access codes: a high-entropy backup way to sign in without an email or password. Pure + testable. */
import { createHash, randomInt } from "node:crypto";

// 31 symbols, no 0/O/1/I/L so a code is easy to read aloud and copy by hand. 16 symbols ≈ 79 bits of entropy.
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 16;
export const QUICK_EMAIL_DOMAIN = "accounts.invalid"; // reserved TLD: can never be a real mailbox

export function generateAccessCode(): string {
  let raw = "";
  for (let i = 0; i < CODE_LENGTH; i++) raw += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return formatAccessCode(raw);
}

export function formatAccessCode(raw: string): string {
  return `NEN-${raw.match(/.{1,4}/g)!.join("-")}`;
}

/** Returns the 16 normalized symbols, or null when the input cannot be a valid code. */
export function normalizeAccessCode(input: string): string | null {
  let s = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.startsWith("NEN") && s.length === CODE_LENGTH + 3) s = s.slice(3);
  if (s.length !== CODE_LENGTH) return null;
  for (const ch of s) if (!CODE_ALPHABET.includes(ch)) return null;
  return s;
}

export function hashAccessCode(normalized: string): string {
  return createHash("sha256").update(`nen-access-code:v1:${normalized}`).digest("hex");
}

export const quickEmail = (token: string) => `quick-${token}@${QUICK_EMAIL_DOMAIN}`;
export const isPlaceholderEmail = (email: string | null | undefined) => !!email && email.endsWith(`@${QUICK_EMAIL_DOMAIN}`);
