import { afterEach, describe, expect, it, vi } from "vitest";

async function load(mode?: string) {
  vi.resetModules();
  if (mode) process.env.SITE_MODE = mode; else delete process.env.SITE_MODE;
  return import("@/config/organization");
}

describe("live vs demo navigation", () => {
  afterEach(() => { delete process.env.SITE_MODE; });

  it("live site has no public directory link in the header or footer", async () => {
    const o = await load();
    expect(o.DEMO_SITE).toBe(false);
    expect(o.getNavItems().map((i) => i.href)).not.toContain("/opportunities");
    expect(o.getPrimaryNav().map((i) => i.href)).not.toContain("/opportunities");
    expect(o.getNavItems().map((i) => i.href)).toEqual(expect.arrayContaining(["/", "/fund", "/other-grants", "/faq", "/contact"]));
  });

  it("demo mode keeps the full app navigation", async () => {
    const o = await load("demo");
    expect(o.DEMO_SITE).toBe(true);
    expect(o.getNavItems().map((i) => i.href)).toContain("/opportunities");
  });
});
