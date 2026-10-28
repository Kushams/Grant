import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { individualCompletion, organizationCompletion, individualProfileSchema } from "@/lib/validation/profile";
import { validateAnswer } from "@/lib/validation/application";
import { slugSchema, slugify } from "@/lib/validation/common";
import { contactSchema } from "@/lib/validation/support";

describe("zod schemas", () => {
  it("normalises emails", () => {
    expect(loginSchema.parse({ email: "  Mixed@Example.TEST ", password: "x" }).email).toBe("mixed@example.test");
  });
  it("registration enforces password rules, consent, matching passwords and an org name", () => {
    const base = { name: "Ann Lee", email: "ann@example.test", password: "Longenough1", confirmPassword: "Longenough1", accountType: "INDIVIDUAL_APPLICANT", consentPrivacy: true };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: "short1", confirmPassword: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "onlyletterslong", confirmPassword: "onlyletterslong" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirmPassword: "Different1234" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, consentPrivacy: false }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, accountType: "ADMIN" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, accountType: "ORGANIZATION_APPLICANT" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, accountType: "ORGANIZATION_APPLICANT", organizationName: "Org", organizationType: "NONPROFIT" }).success).toBe(true);
  });
  it("answer validation by question type", () => {
    const q = (type: string, extra = {}) => ({ key: "k", label: "L", type, options: ["a", "b"], required: true, section: "GENERAL", ...extra });
    expect(validateAnswer(q("NUMBER"), "12.5", true)).toBeNull();
    expect(validateAnswer(q("NUMBER"), "twelve", true)).not.toBeNull();
    expect(validateAnswer(q("DATE"), "2026-02-30x", true)).not.toBeNull();
    expect(validateAnswer(q("DATE"), "2026-02-10", true)).toBeNull();
    expect(validateAnswer(q("YES_NO"), "MAYBE", true)).not.toBeNull();
    expect(validateAnswer(q("SINGLE_CHOICE"), "c", true)).not.toBeNull();
    expect(validateAnswer(q("MULTI_CHOICE"), '["a","b"]', true)).toBeNull();
    expect(validateAnswer(q("MULTI_CHOICE"), '["a","z"]', true)).not.toBeNull();
    expect(validateAnswer(q("URL"), "javascript:alert(1)", true)).not.toBeNull();
    expect(validateAnswer(q("URL"), "https://example.org/page", true)).toBeNull();
    expect(validateAnswer(q("SHORT_TEXT"), "x".repeat(301), true)).not.toBeNull();
    expect(validateAnswer(q("SHORT_TEXT"), "", true)).toBe("This question is required.");
    expect(validateAnswer(q("SHORT_TEXT"), "", false)).toBeNull();
    expect(validateAnswer(q("SHORT_TEXT", { required: false }), "", true)).toBeNull();
  });
  it("slugs", () => {
    expect(slugify("  Café Ünïcode — Grants & More!  ")).toBe("cafe-unicode-grants-more");
    expect(slugSchema.safeParse("Bad Slug").success).toBe(false);
    expect(slugSchema.safeParse("good-slug-1").success).toBe(true);
  });
  it("profile completion is computed from real fields", () => {
    expect(individualCompletion(null).percent).toBe(0);
    expect(individualCompletion({ fullName: "A", country: "B", city: "C", applicantCategory: "INDIVIDUAL", background: "x", interests: ["a"] }).percent).toBe(100);
    expect(organizationCompletion({ name: "A", type: "NONPROFIT" }).missing).toContain("Description");
    expect(individualProfileSchema.safeParse({ fullName: "A B", country: "X", applicantCategory: "INDIVIDUAL", phone: "abc" }).success).toBe(false);
  });
  it("contact form requires consent and a valid reference format", () => {
    const ok = { name: "A B", email: "a@example.test", topic: "My application", message: "A message long enough.", consent: true };
    expect(contactSchema.safeParse(ok).success).toBe(true);
    expect(contactSchema.safeParse({ ...ok, consent: false }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, relatedRef: "nope" }).success).toBe(false);
  });
});

import { safeNext } from "@/lib/safe-redirect";
describe("safeNext (open-redirect guard)", () => {
  it("allows only same-site relative paths", () => {
    expect(safeNext("/dashboard?x=1")).toBe("/dashboard?x=1");
    for (const bad of ["//evil.example", "https://evil.example", "/\\evil", "javascript:alert(1)", "evil", "", null, undefined, "/ok\nSet-Cookie: x=1"]) {
      expect(safeNext(bad as string)).toBeNull();
    }
  });
});
