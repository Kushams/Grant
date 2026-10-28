/**
 * Application status state machine. Every transition is explicit and tied to the roles
 * allowed to perform it. Nothing outside this file decides whether a change is legal.
 */
import type { ApplicationStatus } from "./constants";
import type { Role } from "./constants";

type Actor = Role | "APPLICANT" | "SYSTEM";

/** "APPLICANT" is shorthand for the owning applicant (either applicant role). */
export const TRANSITIONS: Record<ApplicationStatus, Partial<Record<ApplicationStatus, Actor[]>>> = {
  DRAFT: { SUBMITTED: ["APPLICANT"], WITHDRAWN: ["APPLICANT"] },
  SUBMITTED: {
    INITIAL_REVIEW: ["REVIEWER", "ADMIN"],
    WITHDRAWN: ["APPLICANT"],
  },
  INITIAL_REVIEW: {
    UNDER_REVIEW: ["REVIEWER", "ADMIN"],
    INFO_REQUESTED: ["REVIEWER", "ADMIN"],
    RESUBMISSION_REQUIRED: ["REVIEWER", "ADMIN"],
    DECLINED: ["ADMIN"],
    WITHDRAWN: ["APPLICANT"],
  },
  UNDER_REVIEW: {
    INFO_REQUESTED: ["REVIEWER", "ADMIN"],
    RESUBMISSION_REQUIRED: ["REVIEWER", "ADMIN"],
    RECOMMENDED: ["REVIEWER", "ADMIN"],
    DECLINED: ["ADMIN"],
    WITHDRAWN: ["APPLICANT"],
  },
  INFO_REQUESTED: {
    UNDER_REVIEW: ["REVIEWER", "ADMIN", "APPLICANT"], // applicant reply returns it to review
    RESUBMISSION_REQUIRED: ["REVIEWER", "ADMIN"],
    DECLINED: ["ADMIN"],
    WITHDRAWN: ["APPLICANT"],
  },
  RESUBMISSION_REQUIRED: {
    SUBMITTED: ["APPLICANT"],
    DECLINED: ["ADMIN"],
    WITHDRAWN: ["APPLICANT"],
  },
  // Recommendation is separate from the final decision: only an administrator approves.
  RECOMMENDED: {
    APPROVED: ["ADMIN"],
    DECLINED: ["ADMIN"],
    UNDER_REVIEW: ["REVIEWER", "ADMIN"],
  },
  APPROVED: { AWARD_PROCESSING: ["ADMIN", "SYSTEM"], CLOSED: ["ADMIN"] },
  DECLINED: { CLOSED: ["ADMIN"] },
  WITHDRAWN: { CLOSED: ["ADMIN"] },
  // Post-approval statuses are driven by the award/disbursement records (SYSTEM) or an admin.
  AWARD_PROCESSING: {
    DISBURSEMENT_SCHEDULED: ["ADMIN", "SYSTEM"],
    PARTIALLY_DISBURSED: ["ADMIN", "SYSTEM"],
    FULLY_DISBURSED: ["ADMIN", "SYSTEM"],
    CLOSED: ["ADMIN"],
  },
  DISBURSEMENT_SCHEDULED: {
    AWARD_PROCESSING: ["ADMIN", "SYSTEM"],
    PARTIALLY_DISBURSED: ["ADMIN", "SYSTEM"],
    FULLY_DISBURSED: ["ADMIN", "SYSTEM"],
    CLOSED: ["ADMIN"],
  },
  PARTIALLY_DISBURSED: {
    AWARD_PROCESSING: ["ADMIN", "SYSTEM"],
    DISBURSEMENT_SCHEDULED: ["ADMIN", "SYSTEM"],
    FULLY_DISBURSED: ["ADMIN", "SYSTEM"],
    CLOSED: ["ADMIN"],
  },
  FULLY_DISBURSED: {
    AWARD_PROCESSING: ["ADMIN", "SYSTEM"],
    DISBURSEMENT_SCHEDULED: ["ADMIN", "SYSTEM"],
    PARTIALLY_DISBURSED: ["ADMIN", "SYSTEM"],
    CLOSED: ["ADMIN"],
  },
  CLOSED: {},
};

export type ActorKind = "APPLICANT" | "REVIEWER" | "ADMIN" | "SYSTEM";

export function actorKindFor(role: Role | "SYSTEM"): ActorKind {
  if (role === "INDIVIDUAL_APPLICANT" || role === "ORGANIZATION_APPLICANT") return "APPLICANT";
  return role;
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus, actor: ActorKind): boolean {
  const allowed = TRANSITIONS[from]?.[to];
  return !!allowed && allowed.includes(actor);
}

/** All statuses an actor could move an application to from `from` (drives UI options). */
export function allowedTargets(from: ApplicationStatus, actor: ActorKind): ApplicationStatus[] {
  const row = TRANSITIONS[from] ?? {};
  return (Object.keys(row) as ApplicationStatus[]).filter((to) => row[to]!.includes(actor));
}

/** Statuses a reviewer/admin may set from the manual review form (excludes award-phase automation). */
export const MANUAL_REVIEW_TARGETS: ApplicationStatus[] = [
  "INITIAL_REVIEW",
  "UNDER_REVIEW",
  "INFO_REQUESTED",
  "RESUBMISSION_REQUIRED",
  "RECOMMENDED",
  "CLOSED",
];
