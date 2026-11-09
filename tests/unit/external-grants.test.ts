import { describe, expect, it } from "vitest";
import { EXTERNAL_CATEGORIES, EXTERNAL_GRANTS } from "@/content/external-grants";

describe("external grants directory", () => {
  it("has unique slugs, known categories and https official URLs", () => {
    expect(new Set(EXTERNAL_GRANTS.map((g) => g.slug)).size).toBe(EXTERNAL_GRANTS.length);
    for (const g of EXTERNAL_GRANTS) {
      expect(EXTERNAL_CATEGORIES).toContain(g.category);
      expect(g.url).toMatch(/^https:\/\//);
      expect(new URL(g.url).hostname).toMatch(/\.(gov)$/); // official government sources only
      expect(g.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(g.by.length).toBeGreaterThan(3);
    }
  });
  it("covers the categories people asked for", () => {
    for (const c of ["Education", "Healthcare", "Family & housing", "Small business"] as const) expect(EXTERNAL_GRANTS.some((g) => g.category === c)).toBe(true);
  });
});
