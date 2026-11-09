import { describe, expect, it } from "vitest";
import { applicationWindow, checkEligibility } from "@/lib/eligibility";

const base = { status: "PUBLISHED", applicantTypes: '["INDIVIDUAL","NONPROFIT"]', opensAt: null, deadline: null };
const now = new Date("2026-06-01T00:00:00Z");

describe("eligibility", () => {
  it("accepts a configured applicant type", () => {
    expect(checkEligibility(base, "INDIVIDUAL", now).eligible).toBe(true);
  });
  it("rejects types the programme does not accept", () => {
    const r = checkEligibility(base, "SMALL_BUSINESS", now);
    expect(r.eligible).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/not accepted/);
  });
  it("treats unconfigured applicant types as 'to be confirmed', not open to all", () => {
    expect(checkEligibility({ ...base, applicantTypes: "[]" }, "INDIVIDUAL", now).eligible).toBe(false);
  });
  it("enforces the application window", () => {
    expect(applicationWindow({ ...base, deadline: new Date("2026-05-31T00:00:00Z") }, now).state).toBe("CLOSED");
    expect(applicationWindow({ ...base, opensAt: new Date("2026-06-02T00:00:00Z") }, now).state).toBe("NOT_YET_OPEN");
    expect(applicationWindow({ ...base, status: "DRAFT" }, now).state).toBe("NOT_PUBLISHED");
    expect(applicationWindow({ ...base, status: "ARCHIVED" }, now).open).toBe(false);
  });
});
