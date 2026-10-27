import { describe, expect, it } from "vitest";
import { REFERENCE_PATTERN, buildReference, withUniqueReference } from "@/lib/references";

describe("references", () => {
  it("builds human-readable references", () => {
    const r = buildReference("APP", true, new Date("2026-05-01T00:00:00Z"));
    expect(r).toMatch(/^NEN-DEMO-2026-[A-Z2-9]{6}$/);
    expect(REFERENCE_PATTERN.test(r)).toBe(true);
    expect(buildReference("AWD", true)).toMatch(/^NEN-AWD-DEMO-\d{4}-/);
  });
  it("is unique across many draws", () => {
    const s = new Set(Array.from({ length: 5000 }, () => buildReference("APP", true)));
    expect(s.size).toBe(5000);
  });
  it("retries on unique-index collisions only", async () => {
    let calls = 0;
    const out = await withUniqueReference(() => `R${calls}`, async (ref) => {
      calls++;
      if (calls < 3) throw Object.assign(new Error("dup"), { code: "P2002" });
      return ref;
    });
    expect(calls).toBe(3);
    expect(out).toBe("R2");
    await expect(withUniqueReference(() => "x", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
  });
});
