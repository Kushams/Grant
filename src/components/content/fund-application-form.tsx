"use client";

import Link from "next/link";
import { fundApplicationAction } from "@/app/actions/applicant";
import { useActionForm } from "@/lib/use-action-form";
import { CheckboxField, FormMessage, SelectField, SubmitButton, TextArea, TextField, fe } from "@/components/ui/form";
import { APPLICANT_TYPE_LABELS, FUND_APPLICANT_TYPES } from "@/lib/constants";
import { GENERAL_FUND_RANGE } from "@/config/general-fund";

const RANGE_TEXT = `$${Number(GENERAL_FUND_RANGE.min).toLocaleString("en-US")} to $${Number(GENERAL_FUND_RANGE.max).toLocaleString("en-US")}`;

/**
 * The short public application form for the General Opportunity Fund. No account is
 * needed and nothing sensitive is asked: no SSN, no ID, no date of birth and no bank
 * or card details — and applying is free. See HANDOFF.md §0/§3 before adding fields.
 */
export function FundApplicationForm() {
  const { state, onSubmit, pending } = useActionForm(fundApplicationAction);
  const sent = state?.ok === true;
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      {sent ? null : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Full name" name="fullName" autoComplete="name" required error={fe(state, "fullName")} />
            <TextField label="Email address" name="email" type="email" autoComplete="email" required hint="We use this to tell you the outcome." error={fe(state, "email")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Phone number (optional)" name="phone" type="tel" autoComplete="tel" error={fe(state, "phone")} />
            <TextField label="Country you are located in" name="country" autoComplete="country-name" required hint="Open worldwide, except applicants located in Africa." error={fe(state, "country")} />
          </div>
          <SelectField
            label="Which best describes you?"
            name="applicantType"
            required
            placeholder="Choose one…"
            error={fe(state, "applicantType")}
            options={FUND_APPLICANT_TYPES.map((t) => ({ value: t, label: APPLICANT_TYPE_LABELS[t] }))}
          />
          <TextArea label="Tell us about yourself or your organization (optional)" name="story" rows={3} error={fe(state, "story")} />
          <TextArea label="What is the funding for?" name="purpose" required rows={4} hint="What do you want to achieve?" error={fe(state, "purpose")} />
          <TextArea label="How would the money be used?" name="useOfFunds" required rows={4} error={fe(state, "useOfFunds")} />
          <TextField
            label="Amount requested (USD)"
            name="amountRequested"
            inputMode="decimal"
            required
            placeholder="e.g. 50000"
            hint={`Between ${RANGE_TEXT}. Enter numbers only — no bank or card details are ever needed to apply.`}
            error={fe(state, "amountRequested")}
          />
          <TextArea label="Budget summary" name="budgetSummary" required rows={4} hint="A short summary of the costs that adds up to the amount requested." error={fe(state, "budgetSummary")} />
          <SelectField
            label="Do you have a relationship with a NEN director, officer, staff member or reviewer?"
            name="hasConflict"
            required
            defaultValue="no"
            error={fe(state, "hasConflict")}
            options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]}
          />
          <TextField label="If yes, please describe the relationship" name="conflictDetails" error={fe(state, "conflictDetails")} />
          {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input tabIndex={-1} autoComplete="off" name="website" /></label></div>
          <CheckboxField name="consent" error={fe(state, "consent")} label={<>I have read the <Link href="/privacy" target="_blank" className="font-semibold underline">draft privacy notice</Link> and agree that my application may be stored so staff can review it and contact me about the outcome.</>} />
          <SubmitButton pending={pending} size="lg" pendingLabel="Submitting…">Submit application</SubmitButton>
        </>
      )}
    </form>
  );
}
