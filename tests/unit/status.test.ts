import { describe, expect, it } from "vitest";
import { allowedTargets, canTransition } from "@/lib/status";
import { APPLICATION_STATUSES } from "@/lib/constants";

describe("application status machine", () => {
  it("only the applicant can submit", () => {
    expect(canTransition("DRAFT", "SUBMITTED", "APPLICANT")).toBe(true);
    expect(canTransition("DRAFT", "SUBMITTED", "ADMIN")).toBe(false);
    expect(canTransition("DRAFT", "SUBMITTED", "REVIEWER")).toBe(false);
  });
  it("reviewers can recommend but never approve or decline", () => {
    expect(canTransition("UNDER_REVIEW", "RECOMMENDED", "REVIEWER")).toBe(true);
    expect(canTransition("RECOMMENDED", "APPROVED", "REVIEWER")).toBe(false);
    expect(canTransition("UNDER_REVIEW", "DECLINED", "REVIEWER")).toBe(false);
    expect(canTransition("RECOMMENDED", "APPROVED", "ADMIN")).toBe(true);
  });
  it("approval cannot skip the recommendation step", () => {
    expect(canTransition("UNDER_REVIEW", "APPROVED", "ADMIN")).toBe(false);
    expect(canTransition("SUBMITTED", "APPROVED", "ADMIN")).toBe(false);
  });
  it("applicants cannot touch review or award states", () => {
    for (const to of ["INITIAL_REVIEW", "UNDER_REVIEW", "RECOMMENDED", "APPROVED", "DECLINED", "AWARD_PROCESSING", "FULLY_DISBURSED", "CLOSED"] as const) {
      expect(canTransition("INFO_REQUESTED", to, "APPLICANT") && to !== "UNDER_REVIEW").toBe(false);
    }
    expect(canTransition("INFO_REQUESTED", "UNDER_REVIEW", "APPLICANT")).toBe(true);
  });
  it("closed is terminal and every status is defined", () => {
    expect(allowedTargets("CLOSED", "ADMIN")).toEqual([]);
    for (const s of APPLICATION_STATUSES) expect(Array.isArray(allowedTargets(s, "ADMIN"))).toBe(true);
  });
  it("system may advance disbursement statuses", () => {
    expect(canTransition("AWARD_PROCESSING", "DISBURSEMENT_SCHEDULED", "SYSTEM")).toBe(true);
    expect(canTransition("DISBURSEMENT_SCHEDULED", "FULLY_DISBURSED", "SYSTEM")).toBe(true);
    expect(canTransition("DISBURSEMENT_SCHEDULED", "FULLY_DISBURSED", "APPLICANT")).toBe(false);
  });
});
