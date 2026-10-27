"use client";

import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { useActionForm } from "@/lib/use-action-form";
import { FormMessage, SubmitButton, TextField, fe } from "@/components/ui/form";

export function LoginForm({ next }: { next?: string }) {
  const { state, onSubmit, pending } = useActionForm(loginAction);
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage state={state} />
      <TextField label="Email address" name="email" type="email" autoComplete="email" required error={fe(state, "email")} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required error={fe(state, "password")} />
      <SubmitButton pending={pending} className="w-full" size="lg" pendingLabel="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-ink-600">
        New here? <Link href="/register" className="font-semibold text-navy-800 underline">Create an account</Link>
      </p>
      <p className="text-center text-xs text-ink-600">Password reset by email is not available yet. Contact support if you need access restored.</p>
    </form>
  );
}
