/**
 * Safe CSV generation.
 *  - RFC 4180 quoting.
 *  - Spreadsheet formula-injection defence: any cell that would be interpreted as a
 *    formula by Excel/Sheets/LibreOffice (starts with = + - @ TAB CR, also after
 *    leading whitespace) is prefixed with a single quote so it is treated as text.
 */
const FORMULA_START = /^[\s]*[=+\-@\t\r]/;

export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const s = value instanceof Date ? value.toISOString() : String(value);
  // Text that a spreadsheet could execute as a formula is forced to plain text.
  return FORMULA_START.test(s) ? `'${s}` : s;
}

export function escapeCsv(value: unknown): string {
  const s = sanitizeCell(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) lines.push(row.map(escapeCsv).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n"; // BOM so Excel reads UTF-8
}

export function csvFilename(kind: string, now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  return `nen-${kind.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}-${stamp}.csv`;
}
