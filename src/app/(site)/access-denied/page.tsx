import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Access denied" };

export default function AccessDenied() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-bad-700">403</p>
      <h1 className="mt-2 text-3xl font-semibold">You don’t have access to that page</h1>
      <p className="mt-3 text-ink-600">Your account role does not include permission to view this area. If you think this is a mistake, please contact support.</p>
      <div className="mt-6 flex justify-center gap-3">
        <LinkButton href="/dashboard">Go to my dashboard</LinkButton>
        <LinkButton href="/contact" variant="outline">Contact support</LinkButton>
      </div>
    </div>
  );
}
