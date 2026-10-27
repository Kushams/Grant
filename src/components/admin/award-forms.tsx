"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { CheckboxField, SelectField, TextArea, TextField } from "@/components/ui/form";
import { createAwardAction, createDisbursementAction, changeDisbursementStatusAction, updateAwardAction, changeAwardAmountAction, updateDisbursementAction } from "@/app/actions/admin";
import { AWARD_ACCEPTANCE, AWARD_STATUSES, CURRENCIES, CURRENCY_CODES, DISBURSEMENT_LABELS, type DisbursementStatus } from "@/lib/constants";
import { Alert } from "@/components/ui/misc";

export function CreateAwardForm({ options, preselect }: { options: Array<{ id: string; label: string; currency: string; fixed: string }>; preselect?: string }) {
  const [sel, setSel] = useState(options.find((o) => o.id === preselect)?.id ?? "");
  const cur = options.find((o) => o.id === sel);
  return (
    <ActionForm action={createAwardAction} submitLabel="Create award record" pendingLabel="Creating…" className="space-y-4">
      <Alert tone="info" title="This records an administrative decision">No money moves when you create an award. Any fee, upfront payment or “release” charge is never part of this workflow.</Alert>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Approved application" name="applicationId" required value={sel} onChange={(e) => setSel(e.target.value)} placeholder="Choose an approved application…" options={options.map((o) => ({ value: o.id, label: o.label }))} />
        <div className="grid grid-cols-[8rem_1fr] gap-3">
          <SelectField label="Currency" name="currency" key={cur?.currency ?? "x"} defaultValue={cur?.currency ?? "USD"} options={CURRENCY_CODES.map((c) => ({ value: c, label: c }))} />
          <TextField label="Approved amount" name="amount" inputMode="decimal" required key={cur?.fixed ?? "y"} defaultValue={cur?.fixed ?? ""} hint="Exact decimals for the currency, e.g. 2500.00" />
        </div>
        <SelectField label="Award acceptance" name="acceptanceStatus" defaultValue="NOT_REQUIRED" options={AWARD_ACCEPTANCE.map((a) => ({ value: a, label: a.replace("_", " ").toLowerCase() }))} />
      </div>
      <TextArea label="Conditions of award (shown to applicant)" name="conditions" rows={2} />
      <TextArea label="Applicant-visible award summary" name="applicantSummary" rows={2} />
      <TextArea label="Internal notes (hidden from applicant)" name="internalNotes" rows={2} />
    </ActionForm>
  );
}

export function AwardEditForm({ award }: { award: { id: string; status: string; acceptanceStatus: string; conditions: string | null; applicantSummary: string | null; internalNotes: string | null } }) {
  return (
    <ActionForm action={updateAwardAction} hidden={{ id: award.id }} submitLabel="Save award changes" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Award status" name="status" defaultValue={award.status} options={AWARD_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ").toLowerCase() }))} />
        <SelectField label="Acceptance" name="acceptanceStatus" defaultValue={award.acceptanceStatus} options={AWARD_ACCEPTANCE.map((a) => ({ value: a, label: a.replace("_", " ").toLowerCase() }))} />
      </div>
      <TextArea label="Conditions (applicant-visible)" name="conditions" rows={2} defaultValue={award.conditions ?? ""} />
      <TextArea label="Applicant-visible summary" name="applicantSummary" rows={2} defaultValue={award.applicantSummary ?? ""} />
      <TextArea label="Internal notes" name="internalNotes" rows={2} defaultValue={award.internalNotes ?? ""} />
      <TextField label="Reason for this change (audited)" name="reason" required />
    </ActionForm>
  );
}

export function AmountForm({ awardId, current }: { awardId: string; current: string }) {
  return (
    <ActionForm action={changeAwardAmountAction} hidden={{ id: awardId }} submitLabel="Change amount" variant="outline" className="space-y-3">
      <TextField label="New approved amount" name="amount" inputMode="decimal" defaultValue={current} required hint="Cannot be lower than the amount already scheduled." />
      <TextField label="Reason (audited, with previous value)" name="reason" required />
    </ActionForm>
  );
}

export function AddInstalmentForm({ awardId, currency, remaining }: { awardId: string; currency: string; remaining: string }) {
  return (
    <ActionForm action={createDisbursementAction} hidden={{ id: awardId, awardId }} submitLabel="Schedule instalment" variant="accent" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField label={`Planned amount (${currency})`} name="amount" inputMode="decimal" required hint={`Unscheduled balance: ${remaining}`} />
        <TextField label="Planned date" name="plannedDate" type="date" required />
        <TextField label="Milestone / purpose" name="milestone" />
      </div>
      <TextField label="Applicant-visible note" name="applicantNote" />
      <TextField label="Internal notes" name="internalNotes" />
    </ActionForm>
  );
}

export function InstalmentStatusForm({ id, awardId, status, allowed }: { id: string; awardId: string; status: string; allowed: string[] }) {
  const [to, setTo] = useState(allowed[0] ?? "");
  const manual = ["PROCESSING_RECORDED", "PAID_MANUAL", "RECONCILED"].includes(to);
  if (allowed.length === 0) return <p className="text-xs text-ink-600">No further status changes ({DISBURSEMENT_LABELS[status as DisbursementStatus]} is final).</p>;
  return (
    <ActionForm action={changeDisbursementStatusAction} hidden={{ id, awardId }} submitLabel="Record status" size="sm" variant="secondary" className="space-y-2">
      <SelectField label="New status" name="to" value={to} onChange={(e) => setTo(e.target.value)} options={allowed.map((s) => ({ value: s, label: DISBURSEMENT_LABELS[s as DisbursementStatus] }))} />
      <TextField label={manual ? "Reference / evidence note (required)" : "Reason (required)"} name="reason" required />
      {manual ? <CheckboxField name="acknowledgeManual" label="I am manually recording this status. It has not been verified by a payment provider, and this website has not moved any money." /> : null}
    </ActionForm>
  );
}

export function InstalmentEditForm({ d }: { d: { id: string; awardId: string; amount: string; plannedDate: string; milestone: string | null; applicantNote: string | null; internalNotes: string | null } }) {
  return (
    <ActionForm action={updateDisbursementAction} hidden={{ id: d.id, awardId: d.awardId }} submitLabel="Save changes" size="sm" variant="outline" className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <TextField label="Amount" name="amount" inputMode="decimal" defaultValue={d.amount} required />
        <TextField label="Planned date" name="plannedDate" type="date" defaultValue={d.plannedDate} required />
      </div>
      <TextField label="Milestone" name="milestone" defaultValue={d.milestone ?? ""} />
      <TextField label="Applicant-visible note" name="applicantNote" defaultValue={d.applicantNote ?? ""} />
      <TextField label="Internal notes" name="internalNotes" defaultValue={d.internalNotes ?? ""} />
      <TextField label="Reason for edit (audited)" name="reason" required />
    </ActionForm>
  );
}
void CURRENCIES;
