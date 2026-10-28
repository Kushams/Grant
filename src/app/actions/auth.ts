"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { safeAction, formString, type ActionState } from "@/lib/action";
import { endSession, startSession } from "@/lib/auth/session";
import { authenticate, registerUser } from "@/lib/services/users";
import { createQuickAccount, authenticateWithAccessCode } from "@/lib/services/quick-access";
import { can } from "@/lib/permissions";
import { ValidationError } from "@/lib/permissions";
import { safeNext } from "@/lib/safe-redirect";

const homeFor = (role: string) => (can(role, "admin:access") ? "/admin" : "/dashboard");

async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction(async () => {
    const r = await authenticate({ email: formString(fd, "email"), password: formString(fd, "password"), next: formString(fd, "next") }, await clientKey());
    await startSession(r.userId);
    const staffOnly = r.next?.startsWith("/admin") && !can(r.role, "admin:access");
    return { redirectTo: (staffOnly ? null : safeNext(r.next)) ?? homeFor(r.role) };
  });
  if (res.ok && res.redirectTo) redirect(res.redirectTo);
  return res;
}

export async function registerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction(async () => {
    const { userId, role } = await registerUser({
      name: formString(fd, "name"),
      email: formString(fd, "email"),
      password: formString(fd, "password"),
      confirmPassword: formString(fd, "confirmPassword"),
      accountType: formString(fd, "accountType"),
      organizationName: formString(fd, "organizationName") || undefined,
      organizationType: formString(fd, "organizationType") || undefined,
      consentPrivacy: fd.get("consentPrivacy") === "on",
    });
    await startSession(userId);
    return { redirectTo: `${homeFor(role)}${role.includes("APPLICANT") ? "/profile?welcome=1" : ""}` };
  });
  if (res.ok && res.redirectTo) redirect(res.redirectTo);
  return res;
}

/** Quick account: no email or password. Returns the access code once; the user is signed in immediately. */
export async function startQuickAccountAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const { userId, code } = await createQuickAccount({ name: formString(fd, "name"), consentPrivacy: fd.get("consentPrivacy") === "on" });
    await startSession(userId);
    return { data: { code } };
  });
}

export async function accessCodeLoginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction(async () => {
    const r = await authenticateWithAccessCode(formString(fd, "code"), await clientKey());
    await startSession(r.userId);
    return { redirectTo: safeNext(formString(fd, "next")) ?? homeFor(r.role) };
  });
  if (res.ok && res.redirectTo) redirect(res.redirectTo);
  return res;
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/");
}

/**
 * LOCAL DEVELOPMENT HELPER: signs in as a seeded demo account without typing the password.
 * Disabled in production and unless ENABLE_DEMO_LOGIN=true; only works for users flagged isDemo.
 */
export async function demoLoginAction(fd: FormData): Promise<void> {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEMO_LOGIN !== "true") throw new ValidationError("Demo sign-in is disabled.");
  const email = formString(fd, "email").toLowerCase();
  const user = await db.user.findFirst({ where: { email, isDemo: true, isActive: true } });
  if (!user) redirect("/login?error=demo");
  await startSession(user.id);
  redirect(homeFor(user.role));
}
