import { describe, expect, it } from "vitest";
import { impliedApplicationStatus, isOverdue, summarizeAward, validateScheduleTotal, DISBURSEMENT_TRANSITIONS } from "@/lib/awards-calc";

const d = (amountMinor: number, status: string, plannedDate = "2026-01-01") => ({ amountMinor, status, plannedDate: new Date(plannedDate + "T00:00:00Z") });

describe("award calculations", () => {
  const ds = [d(40000, "PAID_MANUAL"), d(30000, "SCHEDULED", "2999-01-01"), d(10000, "CANCELLED"), d(5000, "ON_HOLD", "2999-01-01")];
  it("summarises scheduled, paid and unscheduled amounts (cancelled excluded)", () => {
    const s = summarizeAward(100000, ds, new Date("2026-06-01T00:00:00Z"));
    expect(s.scheduledMinor).toBe(75000);
    expect(s.paidRecordedMinor).toBe(40000);
    expect(s.unscheduledMinor).toBe(25000);
    expect(s.outstandingMinor).toBe(60000);
    expect(s.onHoldCount).toBe(1);
    expect(s.cancelledCount).toBe(1);
    expect(s.fullyScheduled).toBe(false);
  });
  it("rejects schedules that exceed the award, accepts exact fit", () => {
    expect(validateScheduleTotal(100000, ds, 25000).ok).toBe(true);
    const bad = validateScheduleTotal(100000, ds, 25001);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.remainingMinor).toBe(25000);
  });
  it("lets an edited instalment exclude its own previous amount", () => {
    expect(validateScheduleTotal(100000, ds, 55000, true, 30000).ok).toBe(true);
    expect(validateScheduleTotal(100000, ds, 55001, true, 30000).ok).toBe(false);
  });
  it("flags overdue only for unpaid planned instalments", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(isOverdue(d(1, "SCHEDULED", "2026-05-01"), now)).toBe(true);
    expect(isOverdue(d(1, "PAID_MANUAL", "2026-05-01"), now)).toBe(false);
    expect(isOverdue(d(1, "SCHEDULED", "2026-06-02"), now)).toBe(false);
    expect(isOverdue(d(1, "CANCELLED", "2026-05-01"), now)).toBe(false);
  });
  it("derives the application status from records", () => {
    expect(impliedApplicationStatus(100, [])).toBe("AWARD_PROCESSING");
    expect(impliedApplicationStatus(100, [d(50, "SCHEDULED")])).toBe("DISBURSEMENT_SCHEDULED");
    expect(impliedApplicationStatus(100, [d(50, "PAID_MANUAL"), d(50, "SCHEDULED")])).toBe("PARTIALLY_DISBURSED");
    expect(impliedApplicationStatus(100, [d(50, "PAID_MANUAL"), d(50, "RECONCILED")])).toBe("FULLY_DISBURSED");
    expect(impliedApplicationStatus(100, [d(50, "CANCELLED")])).toBe("AWARD_PROCESSING");
  });
  it("final disbursement states have no way out", () => {
    expect(DISBURSEMENT_TRANSITIONS.RECONCILED).toEqual([]);
    expect(DISBURSEMENT_TRANSITIONS.CANCELLED).toEqual([]);
    expect(DISBURSEMENT_TRANSITIONS.SCHEDULED).not.toContain("PAID_MANUAL");
  });
});
