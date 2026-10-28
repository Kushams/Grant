import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, generateAccessCode, hashAccessCode, isPlaceholderEmail, normalizeAccessCode, quickEmail } from "@/lib/auth/access-code";

describe("access codes", () => {
  it("generates NEN-XXXX-XXXX-XXXX-XXXX from the unambiguous alphabet", () => {
    const code = generateAccessCode();
    expect(code).toMatch(/^NEN-([A-Z2-9]{4}-){3}[A-Z2-9]{4}$/);
    for (const ch of code.replace(/NEN|-/g, "")) expect(CODE_ALPHABET).toContain(ch);
    expect(/[01OIL]/.test(code.replace("NEN", ""))).toBe(false);
  });
  it("does not repeat across many generations", () => {
    expect(new Set(Array.from({ length: 500 }, generateAccessCode)).size).toBe(500);
  });
  it("normalizes case, spaces and dashes, with or without the NEN prefix", () => {
    const code = generateAccessCode();
    const n = normalizeAccessCode(code)!;
    expect(n).toHaveLength(16);
    expect(normalizeAccessCode(code.toLowerCase())).toBe(n);
    expect(normalizeAccessCode(code.replace(/-/g, " "))).toBe(n);
    expect(normalizeAccessCode(n)).toBe(n);
  });
  it("rejects wrong length and characters outside the alphabet", () => {
    expect(normalizeAccessCode("")).toBeNull();
    expect(normalizeAccessCode("NEN-ABCD-EFGH")).toBeNull();
    expect(normalizeAccessCode("NEN-0000-0000-0000-0000")).toBeNull();
  });
  it("hashes deterministically, differently per code, and never contains the code", () => {
    const a = normalizeAccessCode(generateAccessCode())!, b = normalizeAccessCode(generateAccessCode())!;
    expect(hashAccessCode(a)).toBe(hashAccessCode(a));
    expect(hashAccessCode(a)).not.toBe(hashAccessCode(b));
    expect(hashAccessCode(a)).not.toContain(a);
  });
  it("marks quick-account placeholder emails", () => {
    expect(isPlaceholderEmail(quickEmail("abc"))).toBe(true);
    expect(isPlaceholderEmail("someone@example.org")).toBe(false);
    expect(isPlaceholderEmail(null)).toBe(false);
  });
});
