"use client";

import { respondAction, withdrawAction } from "@/app/actions/applicant";
import { useActionForm } from "@/lib/use-action-form";
import { FormMessage, SubmitButton, TextArea, fe } from "@/components/ui/form";

export function ReplyForm({ applicationId }: { applicationId: string }) {
  const { state, onSubmit, pending } = useActionForm(respondAction);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <FormMessage state={state} />
      <TextArea label="Your reply to the review team" name="body" required rows={4} error={fe(state, "body")} hint="Please don’t include passwords, ID numbers or bank details." />
      <SubmitButton pending={pending} pendingLabel="Sending…">Send reply</SubmitButton>
    </form>
  );
}

export function WithdrawForm({ applicationId }: { applicationId: string }) {
  const { state, onSubmit, pending } = useActionForm(withdrawAction);
  return (
    <details className="rounded-lg border border-ink-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-bad-700">Withdraw this application</summary>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <input type="hidden" name="applicationId" value={applicationId} />
        <FormMessage state={state} />
        <p className="text-sm text-ink-700">Withdrawing removes it from review. This can’t be undone, but you can start a new application if the programme is still open.</p>
        <TextArea label="Reason (optional)" name="reason" rows={2} />
        <SubmitButton pending={pending} variant="danger" pendingLabel="Withdrawing…">Confirm withdrawal</SubmitButton>
      </form>
    </details>
  );
}
