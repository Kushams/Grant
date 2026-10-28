import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { Spot } from "@/components/graphics/spots";
import { QuickStartForm } from "@/components/auth/quick-start-form";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Quick start" };

export default async function StartPage() {
  // Not redirected on the server: creating the account signs the user in, and the access code must stay on screen.
  const signedIn = !!(await getCurrentUser());
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Spot name="fingerprint" className="mb-4 size-16" />
      <h1 className="text-3xl font-semibold">Quick start</h1>
      <p className="mt-2 text-ink-600">Create an account with just your name — no email and no password. You sign in later with a passkey (fingerprint, face or device unlock) or a personal access code.</p>
      <Alert tone="info" className="mt-6" title="Your privacy">We never ask for ID numbers, bank details or card data. Applying is free and does not guarantee funding.</Alert>
      <Card className="mt-6"><CardBody><QuickStartForm signedIn={signedIn} /></CardBody></Card>
      <p className="mt-4 text-center text-sm text-ink-600">Prefer email and password? <Link href="/register" className="font-semibold text-navy-800 underline">Register here</Link>. Already have an account? <Link href="/login" className="font-semibold text-navy-800 underline">Sign in</Link>.</p>
    </div>
  );
}
