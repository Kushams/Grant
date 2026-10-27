"use client";

import Link from "next/link";
import { contactAction } from "@/app/actions/applicant";
import { useActionForm } from "@/lib/use-action-form";
import { CheckboxField, FormMessage, SelectField, SubmitButton, TextArea, TextField, fe } from "@/components/ui/form";
import { SUPPORT_TOPICS } from "@/lib/constants";

export function ContactForm({ defaults }: { defaults?: { name?: string; email?: string; ref?: string } }) {
  const { state, onSubmit, pending } = useActionForm(contactAction);
  const sent = state?.ok === true;
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      {sent ? null : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Your name" name="name" autoComplete="name" required defaultValue={defaults?.name} error={fe(state, "name")} />
            <TextField label="Email address" name="email" type="email" autoComplete="email" required defaultValue={defaults?.email} error={fe(state, "email")} />
          </div>
          <SelectField label="Topic" name="topic" required placeholder="Choose a topic…" error={fe(state, "topic")} options={SUPPORT_TOPICS.map((t) => ({ value: t, label: t }))} />
          <TextField label="Related opportunity or application reference (optional)" name="relatedRef" defaultValue={defaults?.ref} placeholder="e.g. NEN-APP-2026-ABC234" error={fe(state, "relatedRef")} />
          <TextArea label="Message" name="message" required rows={6} error={fe(state, "message")} hint="Please don’t include passwords, ID numbers or bank details." />
          {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input tabIndex={-1} autoComplete="off" name="website" /></label></div>
          <CheckboxField name="consent" error={fe(state, "consent")} label={<>I have read the <Link href="/privacy" target="_blank" className="font-semibold underline">draft privacy notice</Link> and agree that my message may be stored so staff can respond.</>} />
          <SubmitButton pending={pending} size="lg" pendingLabel="Sending…">Send message</SubmitButton>
        </>
      )}
    </form>
  );
}
