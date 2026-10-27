import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { demoLoginAction } from "@/app/actions/auth";
import { safeNext } from "@/lib/safe-redirect";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const demoEnabled = process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_LOGIN === "true";
  const demoUsers = demoEnabled ? await db.user.findMany({ where: { isDemo: true, isActive: true }, orderBy: [{ role: "desc" }, { name: "asc" }], select: { email: true, name: true, role: true } }) : [];
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[1fr_1fr]">
      <div>
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-ink-600">Access your applications, saved opportunities and notifications.</p>
        <Card className="mt-6"><CardBody>
          {sp.error === "demo" ? <Alert tone="bad" className="mb-4" title="That demo account is not available." /> : null}
          <LoginForm next={safeNext(sp.next) ?? undefined} />
        </CardBody></Card>
      </div>
      {demoEnabled ? (
        <div>
          <h2 className="text-xl font-semibold">Local demo accounts</h2>
          <p className="mt-2 text-sm text-ink-600">
            Development helper (hidden in production). Each button signs you in as a <strong>fictional</strong> seeded user — no password is typed or exposed.
            You can also sign in manually with the seed password from <code className="rounded bg-ink-100 px-1">.env</code> (see README).
          </p>
          {demoUsers.length === 0 ? (
            <Alert tone="warn" className="mt-4" title="No demo users found">Run <code>npm run db:seed</code> to create them.</Alert>
          ) : (
            <ul className="mt-4 space-y-2">
              {demoUsers.map((u) => (
                <li key={u.email}>
                  <form action={demoLoginAction} className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-surface p-3">
                    <input type="hidden" name="email" value={u.email} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink-900">{u.name}</p>
                      <p className="truncate text-xs text-ink-600">{ROLE_LABELS[u.role as Role]} · {u.email}</p>
                    </div>
                    <Button type="submit" size="sm" variant="secondary" aria-label={`Sign in as ${u.name}, ${ROLE_LABELS[u.role as Role]}`}>Sign in</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
