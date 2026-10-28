import { DEMO_SITE } from "@/config/organization";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-ink-600">Registering lets you save opportunities, prepare applications and track progress. It is free and does not guarantee any funding.</p>
      <Alert tone="info" className="mt-6" title={DEMO_SITE ? "Prototype environment" : "Your privacy"}>
        {DEMO_SITE ? "Accounts here are local to this demo database. " : ""}Please do not enter government ID numbers, bank details or other sensitive data — none is ever requested.
      </Alert>
      <p className="mt-4 text-sm text-ink-700">Don’t want to use an email? <Link href="/start" className="font-semibold text-navy-800 underline">Create a quick account</Link> with just your name and sign in with a passkey.</p>
      <Card className="mt-6"><CardBody><RegisterForm /></CardBody></Card>
    </div>
  );
}
