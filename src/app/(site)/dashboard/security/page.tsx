import type { Metadata } from "next";
import { requireApplicant } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listPasskeys } from "@/lib/services/passkeys";
import { PageHeader } from "@/components/ui/misc";
import { SecurityPanel } from "@/components/dashboard/security-panel";

export const metadata: Metadata = { title: "Sign-in & security" };

export default async function SecurityPage() {
  const user = await requireApplicant("/dashboard/security");
  const [passkeys, row] = await Promise.all([listPasskeys(user.id), db.user.findUnique({ where: { id: user.id }, select: { accessCodeHash: true } })]);
  return (
    <>
      <PageHeader title="Sign-in & security" description="Choose how you sign in. Keep at least one way to get back into your account." />
      <SecurityPanel
        passkeys={passkeys.map((k) => ({ id: k.id, label: k.label, createdAt: k.createdAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString() ?? null }))}
        hasAccessCode={!!row?.accessCodeHash} canUseCode />
    </>
  );
}
