/**
 * Decimal-safe money handling. Amounts are INTEGER MINOR UNITS (cents) plus an ISO
 * currency code. No floating-point arithmetic is used for totals or parsing.
 */
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "./constants";

/** Hard ceiling per single amount (keeps us inside SQLite/Prisma 32-bit Int). */
export const MAX_MINOR = 2_000_000_000;

export function isCurrency(code: string): code is CurrencyCode {
  return (CURRENCY_CODES as string[]).includes(code);
}

export function currencyDecimals(code: string): number {
  return isCurrency(code) ? CURRENCIES[code].decimals : 2;
}

/**
 * Parse a human-entered amount ("1,250.50") into minor units using string math only.
 * Returns null when the text is not a valid non-negative amount for the currency.
 */
export function parseAmountToMinor(input: string, currency: string): number | null {
  const decimals = currencyDecimals(currency);
  const cleaned = input.trim().replace(/[,\s_]/g, "");
  const m = /^(\d{1,12})(?:\.(\d+))?$/.exec(cleaned);
  if (!m) return null;
  const whole = m[1];
  const frac = m[2] ?? "";
  if (frac.length > decimals) return null; // never silently round money
  const padded = frac.padEnd(decimals, "0");
  const minor = Number(whole + padded);
  if (!Number.isSafeInteger(minor) || minor > MAX_MINOR) return null;
  return minor;
}

export function formatMinor(minor: number, currency: string): string {
  const decimals = currencyDecimals(currency);
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const s = String(abs).padStart(decimals + 1, "0");
  const whole = decimals ? s.slice(0, -decimals) : s;
  const frac = decimals ? s.slice(-decimals) : "";
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${currency} ${grouped}${decimals ? "." + frac : ""}`;
}

/** Value for pre-filling an <input> (no currency code, no grouping). */
export function minorToInputValue(minor: number | null | undefined, currency: string): string {
  if (minor == null) return "";
  const decimals = currencyDecimals(currency);
  const s = String(minor).padStart(decimals + 1, "0");
  return decimals ? `${s.slice(0, -decimals)}.${s.slice(-decimals)}` : s;
}

export function sumMinor(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Basic range check shared by every monetary Zod schema. */
export function isValidMinor(n: number): boolean {
  return Number.isInteger(n) && n > 0 && n <= MAX_MINOR;
}
