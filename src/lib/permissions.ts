/**
 * Explicit permission matrix. Authorization decisions are made from the SERVER-side
 * session user — never from a role/ID supplied by the browser.
 */
import type { Role } from "./constants";

export const PERMISSIONS = [
  "opportunity:manage",
  "opportunity:verify",
  "application:review",
  "application:assign",
  "application:decide",
  "application:viewAll",
  "award:manage",
  "award:view",
  "support:manage",
  "audit:view",
  "users:manage",
  "export:run",
  "admin:access",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, Permission[]> = {
  INDIVIDUAL_APPLICANT: [],
  ORGANIZATION_APPLICANT: [],
  // Reviewers: assigned applications only (scoped in the service layer), notes/recommendations.
  REVIEWER: ["admin:access", "application:review"],
  ADMIN: [
    "admin:access",
    "opportunity:manage",
    "opportunity:verify",
    "application:review",
    "application:assign",
    "application:decide",
    "application:viewAll",
    "award:manage",
    "award:view",
    "support:manage",
    "audit:view",
    "users:manage",
    "export:run",
  ],
};

export function can(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (MATRIX[role as Role] ?? []).includes(permission);
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}
export class NotFoundError extends Error {
  constructor(message = "Not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}
export class ValidationError extends Error {
  fieldErrors?: Record<string, string[]>;
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function assertCan(role: string | undefined | null, permission: Permission): void {
  if (!can(role, permission)) throw new ForbiddenError();
}

/** Minimal identity passed to services. Built from the verified session only. */
export type Actor = { id: string; role: Role; name: string };
