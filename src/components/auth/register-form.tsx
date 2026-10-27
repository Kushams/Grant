"use client";

import Link from "next/link";
import { useState } from "react";
import { registerAction } from "@/app/actions/auth";
import { useActionForm } from "@/lib/use-action-form";
import { CheckboxField, FormMessage, SelectField, SubmitButton, TextField, fe } from "@/components/ui/form";
import { APPLICANT_TYPE_LABELS, ORGANIZATION_TYPES } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function RegisterForm() {
  const { state, onSubmit, pending } = useActionForm(registerAction);
  const [type, setType] = useState<"INDIVIDUAL_APPLICANT" | "ORGANIZATION_APPLICANT">("INDIVIDUAL_APPLICANT");
  const isOrg = type === "ORGANIZATION_APPLICANT";
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink-900">I am registering as</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["INDIVIDUAL_APPLICANT", "An individual", "Apply as yourself or as an entrepreneur."],
            ["ORGANIZATION_APPLICANT", "An organization or business", "Apply for a business, nonprofit or community group."],
          ] as const).map(([value, title, desc]) => (
            <label key={value} className={cn("flex cursor-pointer gap-3 rounded-lg border p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-teal-600", type === value ? "border-navy-700 bg-navy-50" : "border-ink-300 bg-white")}>
              <input type="radio" name="accountType" value={value} checked={type === value} onChange={() => setType(value)} className="mt-1 size-4 accent-navy-800" />
              <span><span className="block text-sm font-bold text-ink-900">{title}</span><span className="block text-sm text-ink-600">{desc}</span></span>
            </label>
          ))}
        </div>
        {fe(state, "accountType") ? <p className="text-sm font-medium text-bad-700">{fe(state, "accountType")!.join(" ")}</p> : null}
      </fieldset>

      <TextField label={isOrg ? "Your full name (account holder)" : "Full name"} name="name" autoComplete="name" required error={fe(state, "name")} />
      {isOrg ? (
        <>
          <TextField label="Organization name" name="organizationName" autoComplete="organization" required error={fe(state, "organizationName")} />
          <SelectField label="Organization type" name="organizationType" required placeholder="Choose a type…" error={fe(state, "organizationType")}
            options={ORGANIZATION_TYPES.map((t) => ({ value: t, label: APPLICANT_TYPE_LABELS[t] }))} />
        </>
      ) : null}
      <TextField label="Email address" name="email" type="email" autoComplete="email" required error={fe(state, "email")} hint="Use a personal or organizational address you control. Demo or test addresses are fine for the prototype." />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Password" name="password" type="password" autoComplete="new-password" required error={fe(state, "password")} hint="At least 10 characters, with letters and numbers." />
        <TextField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required error={fe(state, "confirmPassword")} />
      </div>
      <CheckboxField name="consentPrivacy" error={fe(state, "consentPrivacy")}
        label={<>I have read the <Link href="/privacy" className="font-semibold underline" target="_blank">draft privacy notice</Link> and understand this is a prototype.</>} />
      <SubmitButton pending={pending} className="w-full" size="lg" pendingLabel="Creating account…">Create account</SubmitButton>
      <p className="text-center text-sm text-ink-600">Already registered? <Link href="/login" className="font-semibold text-navy-800 underline">Sign in</Link></p>
    </form>
  );
}
