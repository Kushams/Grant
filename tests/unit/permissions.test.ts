import { describe, expect, it } from "vitest";
import { can, PERMISSIONS } from "@/lib/permissions";

describe("permission matrix", () => {
  it("applicants have no staff permissions", () => {
    for (const p of PERMISSIONS) {
      expect(can("INDIVIDUAL_APPLICANT", p)).toBe(false);
      expect(can("ORGANIZATION_APPLICANT", p)).toBe(false);
    }
  });
  it("reviewers may review but not manage config, awards, exports or decisions", () => {
    expect(can("REVIEWER", "application:review")).toBe(true);
    for (const p of ["opportunity:manage", "application:decide", "application:assign", "award:manage", "award:view", "export:run", "audit:view", "users:manage", "support:manage"] as const) {
      expect(can("REVIEWER", p)).toBe(false);
    }
  });
  it("administrators have every permission", () => {
    for (const p of PERMISSIONS) expect(can("ADMIN", p)).toBe(true);
  });
  it("unknown / missing roles get nothing", () => {
    expect(can(undefined, "admin:access")).toBe(false);
    expect(can("SUPERUSER", "admin:access")).toBe(false);
  });
});
