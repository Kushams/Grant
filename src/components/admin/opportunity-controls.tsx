"use client";

import { ActionForm } from "@/components/ui/action-form";
import { CheckboxField, TextArea } from "@/components/ui/form";
import { setOpportunityStatusAction, verifyLiveAction } from "@/app/actions/admin";

export function StatusControl({ id, to, label, variant = "primary" }: { id: string; to: "PUBLISHED" | "DRAFT" | "ARCHIVED"; label: string; variant?: "primary" | "outline" | "danger" | "accent" }) {
  return <ActionForm action={setOpportunityStatusAction} hidden={{ id, to }} submitLabel={label} variant={variant} className="space-y-2"><span className="sr-only">{label}</span></ActionForm>;
}

export function VerifyLiveForm({ id }: { id: string }) {
  return (
    <ActionForm action={verifyLiveAction} hidden={{ id }} submitLabel="Record verification & classify as LIVE" variant="danger" className="space-y-3">
      <TextArea label="How, when and by whom were the details verified?" name="note" required rows={3} hint="Stored with your name and the timestamp." />
      <CheckboxField name="confirm" label="I confirm every detail and the programme terms were verified with the funder and approved by the organization. I understand this removes the DEMO label." />
    </ActionForm>
  );
}
