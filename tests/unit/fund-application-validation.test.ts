import { describe, expect, it } from "vitest";
import { fundApplicationSchema, isAfricanCountry } from "@/lib/validation/fund-application";

const valid = (over: Record<string, unknown> = {}) => ({
  fullName: "Jamie Example",
  email: "jamie@example.test",
  phone: "",
  country: "United States",
  applicantType: "INDIVIDUAL",
  story: "",
  purpose: "Fund a community training programme for young people.",
  useOfFunds: "Pay for a venue, materials and two part-time tutors.",
  amountRequested: "50000",
  budgetSummary: "Venue 10,000; materials 15,000; tutors 25,000.",
  hasConflict: false,
  conflictDetails: "",
  consent: true,
  ...over,
});

describe("fund application schema (short form)", () => {
  it("accepts a complete short-form application and converts the amount to minor units", () => {
    const out = fundApplicationSchema.parse(valid());
    expect(out.amountRequested).toBe(5_000_000);
    expect(out.phone).toBeUndefined();
    expect(out.story).toBeUndefined();
  });

  it("accepts the range boundaries and rejects amounts outside $25,000–$500,000", () => {
    expect(fundApplicationSchema.parse(valid({ amountRequested: "25000" })).amountRequested).toBe(2_500_000);
    expect(fundApplicationSchema.parse(valid({ amountRequested: "500,000.00" })).amountRequested).toBe(50_000_000);
    expect(() => fundApplicationSchema.parse(valid({ amountRequested: "24999.99" }))).toThrow(/between/);
    expect(() => fundApplicationSchema.parse(valid({ amountRequested: "500001" }))).toThrow(/between/);
    expect(() => fundApplicationSchema.parse(valid({ amountRequested: "lots" }))).toThrow();
  });

  it("rejects applicants located in Africa (published eligibility rule)", () => {
    for (const c of ["Nigeria", "kenya", "South Africa", "Côte d'Ivoire", "DR Congo"]) {
      expect(isAfricanCountry(c)).toBe(true);
      expect(() => fundApplicationSchema.parse(valid({ country: c }))).toThrow(/located in Africa/);
    }
    expect(isAfricanCountry("United States")).toBe(false);
    expect(isAfricanCountry("Niger")).toBe(true); // exact state name, not a substring match on "Nigeria"
    expect(isAfricanCountry("United Kingdom")).toBe(false);
  });

  it("requires conflict details when a conflict is declared, and drops them when none is declared", () => {
    expect(() => fundApplicationSchema.parse(valid({ hasConflict: true, conflictDetails: "" }))).toThrow(/describe the relationship/);
    const yes = fundApplicationSchema.parse(valid({ hasConflict: true, conflictDetails: "My cousin is a reviewer." }));
    expect(yes.conflictDetails).toBe("My cousin is a reviewer.");
  });

  it("requires privacy consent and valid contact details", () => {
    expect(() => fundApplicationSchema.parse(valid({ consent: false }))).toThrow();
    expect(() => fundApplicationSchema.parse(valid({ email: "not-an-email" }))).toThrow();
    expect(() => fundApplicationSchema.parse(valid({ applicantType: "ALIEN" }))).toThrow();
    expect(() => fundApplicationSchema.parse(valid({ phone: "call me!" }))).toThrow();
  });

  it("has no sensitive fields: SSN / ID / bank data in the payload are ignored, never stored by the schema", () => {
    const out = fundApplicationSchema.parse(valid({ ssn: "123-45-6789", idNumber: "X123", bankAccount: "000123456" }));
    expect(out).not.toHaveProperty("ssn");
    expect(out).not.toHaveProperty("idNumber");
    expect(out).not.toHaveProperty("bankAccount");
  });
});
