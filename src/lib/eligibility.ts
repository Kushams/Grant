import { parseList } from "./json";

export type EligibilityOpportunity = {
  status: string;
  applicantTypes: string;
  opensAt: Date | null;
  deadline: Date | null;
};

export type EligibilityResult = { eligible: boolean; reasons: string[] };

/** Is the opportunity currently accepting applications at all? */
export function applicationWindow(opp: Pick<EligibilityOpportunity, "status" | "opensAt" | "deadline">, now = new Date()): {
  open: boolean;
  state: "OPEN" | "NOT_PUBLISHED" | "NOT_YET_OPEN" | "CLOSED";
} {
  if (opp.status !== "PUBLISHED") return { open: false, state: "NOT_PUBLISHED" };
  if (opp.opensAt && opp.opensAt.getTime() > now.getTime()) return { open: false, state: "NOT_YET_OPEN" };
  if (opp.deadline && opp.deadline.getTime() < now.getTime()) return { open: false, state: "CLOSED" };
  return { open: true, state: "OPEN" };
}

/** Pure eligibility check used by the UI (to explain) AND by the server on every start/submit. */
export function checkEligibility(opp: EligibilityOpportunity, applicantCategory: string, now = new Date()): EligibilityResult {
  const reasons: string[] = [];
  const win = applicationWindow(opp, now);
  if (win.state === "NOT_PUBLISHED") reasons.push("This opportunity is not currently published.");
  if (win.state === "NOT_YET_OPEN") reasons.push("Applications for this opportunity have not opened yet.");
  if (win.state === "CLOSED") reasons.push("The application deadline has passed.");

  const accepted = parseList(opp.applicantTypes);
  if (accepted.length === 0) {
    reasons.push("Accepted applicant types are still to be confirmed for this opportunity.");
  } else if (!accepted.includes(applicantCategory)) {
    reasons.push("Your applicant type is not accepted by this opportunity.");
  }
  return { eligible: reasons.length === 0, reasons };
}

export function deadlineLabel(deadline: Date | null, now = new Date()): string {
  if (!deadline) return "Deadline to be confirmed";
  const days = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days <= 30) return `${days} days left`;
  return "Open";
}
