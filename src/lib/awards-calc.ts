/** Pure money/schedule calculations for awards and disbursements (integer minor units only). */
import { NON_COUNTING, PAID_RECORDED, type DisbursementStatus } from "./constants";

export type DisbursementLike = { amountMinor: number; status: string; plannedDate: Date };

export const isCounting = (status: string): boolean => !NON_COUNTING.includes(status as DisbursementStatus);
export const isPaidRecorded = (status: string): boolean => PAID_RECORDED.includes(status as DisbursementStatus);

const OVERDUE_STATUSES = ["SCHEDULED", "AWAITING_PROCESSING", "PROCESSING_RECORDED"];
export function isOverdue(d: DisbursementLike, now = new Date()): boolean {
  return OVERDUE_STATUSES.includes(d.status) && d.plannedDate.getTime() < startOfDay(now).getTime();
}
const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export type AwardSummary = {
  awardMinor: number;
  scheduledMinor: number; // planned instalments that still count (excludes cancelled / failed)
  unscheduledMinor: number; // awardMinor - scheduledMinor (can be >0: schedule incomplete)
  paidRecordedMinor: number; // manually recorded as paid (NOT provider-verified)
  outstandingMinor: number; // awardMinor - paidRecordedMinor
  overdueCount: number;
  onHoldCount: number;
  cancelledCount: number;
  fullyScheduled: boolean;
};

export function summarizeAward(awardMinor: number, ds: DisbursementLike[], now = new Date()): AwardSummary {
  const scheduledMinor = ds.filter((d) => isCounting(d.status)).reduce((a, d) => a + d.amountMinor, 0);
  const paidRecordedMinor = ds.filter((d) => isPaidRecorded(d.status)).reduce((a, d) => a + d.amountMinor, 0);
  return {
    awardMinor,
    scheduledMinor,
    unscheduledMinor: awardMinor - scheduledMinor,
    paidRecordedMinor,
    outstandingMinor: awardMinor - paidRecordedMinor,
    overdueCount: ds.filter((d) => isOverdue(d, now)).length,
    onHoldCount: ds.filter((d) => d.status === "ON_HOLD").length,
    cancelledCount: ds.filter((d) => d.status === "CANCELLED").length,
    fullyScheduled: scheduledMinor === awardMinor,
  };
}

/**
 * Would adding/changing an instalment keep the schedule within the approved award?
 * `excludeAmountMinor` is the current amount of the instalment being edited (if any).
 */
export function validateScheduleTotal(
  awardMinor: number,
  existing: DisbursementLike[],
  newAmountMinor: number,
  newStatusCounts = true,
  excludeAmountMinor = 0,
): { ok: true; remainingAfterMinor: number } | { ok: false; message: string; remainingMinor: number } {
  const current = existing.filter((d) => isCounting(d.status)).reduce((a, d) => a + d.amountMinor, 0) - excludeAmountMinor;
  const after = current + (newStatusCounts ? newAmountMinor : 0);
  if (after > awardMinor) {
    return { ok: false, remainingMinor: awardMinor - current, message: "The scheduled instalments would exceed the approved award amount." };
  }
  return { ok: true, remainingAfterMinor: awardMinor - after };
}

/** Which application status should the award/disbursement records imply? */
export function impliedApplicationStatus(
  awardMinor: number,
  ds: DisbursementLike[],
): "AWARD_PROCESSING" | "DISBURSEMENT_SCHEDULED" | "PARTIALLY_DISBURSED" | "FULLY_DISBURSED" {
  const paid = ds.filter((d) => isPaidRecorded(d.status)).reduce((a, d) => a + d.amountMinor, 0);
  if (awardMinor > 0 && paid >= awardMinor) return "FULLY_DISBURSED";
  if (paid > 0) return "PARTIALLY_DISBURSED";
  if (ds.some((d) => isCounting(d.status))) return "DISBURSEMENT_SCHEDULED";
  return "AWARD_PROCESSING";
}

/** Legal manual status transitions for a disbursement record. */
export const DISBURSEMENT_TRANSITIONS: Record<DisbursementStatus, DisbursementStatus[]> = {
  NOT_SCHEDULED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["AWAITING_PROCESSING", "ON_HOLD", "CANCELLED"],
  AWAITING_PROCESSING: ["PROCESSING_RECORDED", "PAID_MANUAL", "ON_HOLD", "CANCELLED", "FAILED_MANUAL"],
  PROCESSING_RECORDED: ["PAID_MANUAL", "FAILED_MANUAL", "ON_HOLD"],
  PAID_MANUAL: ["RECONCILED", "FAILED_MANUAL"],
  ON_HOLD: ["SCHEDULED", "AWAITING_PROCESSING", "CANCELLED"],
  FAILED_MANUAL: ["SCHEDULED", "CANCELLED"],
  RECONCILED: [],
  CANCELLED: [],
};
/** Statuses that assert money moved — they must be acknowledged as manual, unverified entries. */
export const REQUIRES_MANUAL_ACK: DisbursementStatus[] = ["PROCESSING_RECORDED", "PAID_MANUAL", "RECONCILED"];
/** Once recorded as paid/reconciled the amount & date are locked. */
export const LOCKED_FOR_EDIT: DisbursementStatus[] = ["PAID_MANUAL", "RECONCILED", "CANCELLED"];
