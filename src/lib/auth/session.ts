import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSession,
  destroySession,
  validateSessionToken,
  type SessionUser,
} from "./session-store";
import { can, ForbiddenError, type Actor, type Permission } from "../permissions";
import { isApplicantRole, type Role } from "../constants";

function cookieOptions(expires: Date) {
  const secure = process.env.NODE_ENV === "production" && process.env.SESSION_COOKIE_SECURE !== "false";
  return { httpOnly: true, sameSite: "lax" as const, secure, path: "/", expires };
}

export async function startSession(userId: string): Promise<void> {
  const { token, expiresAt } = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  await destroySession(jar.get(SESSION_COOKIE)?.value);
  jar.set(SESSION_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 });
}

/** Per-request memoized lookup of the signed-in user (or null). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return validateSessionToken(token);
});
export { SESSION_TTL_MS };

export const accessDenied = (): never => redirect("/access-denied");

/** Pages: redirect to sign-in when there is no valid session. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  return user;
}

export async function requireRole(roles: Role[], nextPath?: string): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!roles.includes(user.role)) accessDenied();
  return user;
}

export async function requireApplicant(nextPath?: string): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!isApplicantRole(user.role)) accessDenied();
  return user;
}

export async function requirePermission(permission: Permission, nextPath?: string): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!can(user.role, permission)) accessDenied();
  return user;
}

/** Server actions: throw (caught by safeAction) instead of redirecting. */
export async function getActor(): Promise<Actor> {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Please sign in to continue.");
  return { id: user.id, role: user.role, name: user.name };
}

export async function getActorWith(permission: Permission): Promise<Actor> {
  const actor = await getActor();
  if (!can(actor.role, permission)) throw new ForbiddenError();
  return actor;
}
