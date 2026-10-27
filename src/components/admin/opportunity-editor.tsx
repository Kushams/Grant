"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveOpportunityAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { useActionForm } from "@/lib/use-action-form";
import { CheckboxField, FormMessage, SelectField, SubmitButton, TextArea, TextField, fe } from "@/components/ui/form";
import { APPLICANT_TYPES, APPLICANT_TYPE_LABELS, AWARD_TYPES, CURRENCIES, CURRENCY_CODES, PROGRAMME_CATEGORIES, PROJECT_PRESETS, QUESTION_SECTIONS, QUESTION_TYPES, QUESTION_TYPE_LABELS, REGIONS } from "@/lib/constants";
import { NO_FEE_STATEMENT } from "@/config/organization";

export type EditorValues = {
  id: string | null; title: string; slug: string; shortDescription: string; description: string; category: string; classification: string;
  applicantTypes: string[]; eligibleRegions: string[]; keywords: string; fundingSpecified: boolean; currency: string; minAmount: string; maxAmount: string; fixedAmount: string;
  awardType: string; fundingPurpose: string; fundingTerms: string; plannedInstallments: string; installmentPlan: string; milestones: string; paymentSchedule: string; disbursementConditions: string;
  eligibilityCriteria: string; requiredInformation: string; requiredDocuments: string; opensAt: string; deadline: string; selectionProcess: string; decisionTimeline: string;
  programmeTerms: string; termsApproved: boolean; funderName: string; funderVerified: boolean; allowMultipleApplications: boolean; feePolicyNote: string;
  faq: Array<{ q: string; a: string }>;
  questions: Array<{ key: string; label: string; helpText: string; type: string; options: string; required: boolean; section: string }>;
};

const keyFrom = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^[^a-z]+/, "q").slice(0, 40) || "question";

export function OpportunityEditor({ v }: { v: EditorValues }) {
  const { state, onSubmit, pending } = useActionForm(saveOpportunityAction);
  const [funding, setFunding] = useState(v.fundingSpecified);
  const [cur, setCur] = useState(v.currency);
  const [qs, setQs] = useState(v.questions);
  const [faq, setFaq] = useState(v.faq);
  const upd = (i: number, patch: Partial<EditorValues["questions"][number]>) => setQs((a) => a.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, d: number) => setQs((a) => { const b = [...a]; const j = i + d; if (j < 0 || j >= b.length) return a; [b[i], b[j]] = [b[j], b[i]]; return b; });
  const serialQs = JSON.stringify(qs.map((q) => ({ ...q, key: q.key || keyFrom(q.label), options: q.options.split(",").map((s) => s.trim()).filter(Boolean), helpText: q.helpText || undefined })));
  const hasQErr = Object.keys(state?.fieldErrors ?? {}).filter((k) => k.startsWith("questions")).flatMap((k) => state!.fieldErrors![k]);

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {v.id ? <input type="hidden" name="id" value={v.id} /> : null}
      <input type="hidden" name="questions" value={serialQs} />
      <input type="hidden" name="faq" value={JSON.stringify(faq)} />
      <FormMessage state={state} />
      {hasQErr.length ? <Alert tone="bad" title="Question problems"><ul className="list-disc pl-5">{hasQErr.map((m, i) => <li key={i}>{m}</li>)}</ul></Alert> : null}

      <Card><CardHeader title="Basics" /><CardBody className="space-y-4">
        <TextField label="Title" name="title" defaultValue={v.title} required error={fe(state, "title")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Slug (URL)" name="slug" defaultValue={v.slug} error={fe(state, "slug")} hint="Leave blank to generate from the title." />
          <SelectField label="Programme category" name="category" defaultValue={v.category} placeholder="Choose…" required error={fe(state, "category")} options={PROGRAMME_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <TextArea label="Short description" name="shortDescription" defaultValue={v.shortDescription} rows={2} required error={fe(state, "shortDescription")} />
        <TextArea label="Full description" name="description" defaultValue={v.description} rows={6} required error={fe(state, "description")} />
        <TextField label="Keywords (comma-separated)" name="keywords" defaultValue={v.keywords} />
        <p className="text-sm text-ink-600">Classification: <strong>{v.classification}</strong>. It cannot be changed here — converting to LIVE needs the separate verification step on the opportunity page.</p>
      </CardBody></Card>

      <Card><CardHeader title="Eligibility" description="Leave a field empty to show “Details to be confirmed” publicly — nothing is assumed." /><CardBody className="space-y-4">
        <fieldset><legend className="mb-2 text-sm font-semibold">Accepted applicant types</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{APPLICANT_TYPES.map((t) => <label key={t} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"><input type="checkbox" name="applicantTypes" value={t} defaultChecked={v.applicantTypes.includes(t)} className="size-4 accent-teal-700" />{APPLICANT_TYPE_LABELS[t]}</label>)}</div>
          {fe(state, "applicantTypes") ? <p className="mt-1 text-sm text-bad-700">{fe(state, "applicantTypes")!.join(" ")}</p> : null}</fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">Eligible regions</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{REGIONS.map((t) => <label key={t} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"><input type="checkbox" name="eligibleRegions" value={t} defaultChecked={v.eligibleRegions.includes(t)} className="size-4 accent-teal-700" />{t}</label>)}</div></fieldset>
        <TextArea label="Eligibility criteria (one per line)" name="eligibilityCriteria" rows={4} defaultValue={v.eligibilityCriteria} />
        <TextArea label="Required information (one per line)" name="requiredInformation" rows={3} defaultValue={v.requiredInformation} />
        <TextArea label="Required documents (one per line)" name="requiredDocuments" rows={2} defaultValue={v.requiredDocuments} hint="The prototype does not collect documents; this list is informational." />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Applications open" name="opensAt" type="date" defaultValue={v.opensAt} error={fe(state, "opensAt")} />
          <TextField label="Deadline" name="deadline" type="date" defaultValue={v.deadline} error={fe(state, "deadline")} />
        </div>
        <CheckboxField name="allowMultipleApplications" defaultChecked={v.allowMultipleApplications} label="Allow the same applicant to submit more than one application (default: one each, enforced by the database)" />
      </CardBody></Card>

      <Card><CardHeader title="Funding, award & disbursement configuration" description="Amounts are stored as exact minor units. Never publish sample amounts as real." /><CardBody className="space-y-4">
        <CheckboxField name="fundingSpecified" checked={funding} onChange={(e) => setFunding(e.target.checked)} label="A funding amount is specified for this opportunity" />
        {funding ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Currency" name="currency" value={cur} onChange={(e) => setCur(e.target.value)} options={CURRENCY_CODES.map((c) => ({ value: c, label: `${c} — ${CURRENCIES[c].name}` }))} />
            <TextField label="Minimum" name="minAmount" inputMode="decimal" defaultValue={v.minAmount} error={fe(state, "minAmount")} />
            <TextField label="Maximum" name="maxAmount" inputMode="decimal" defaultValue={v.maxAmount} error={fe(state, "maxAmount")} />
            <TextField label="…or fixed amount" name="fixedAmount" inputMode="decimal" defaultValue={v.fixedAmount} error={fe(state, "fixedAmount")} hint="Use a fixed amount OR a range." />
          </div>
        ) : <input type="hidden" name="currency" value={cur} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Award type" name="awardType" defaultValue={v.awardType} placeholder="To be confirmed" options={AWARD_TYPES.map((t) => ({ value: t, label: t }))} hint="Not every opportunity is a cash grant." />
          <TextField label="Planned instalments" name="plannedInstallments" type="number" min={1} max={60} defaultValue={v.plannedInstallments} />
        </div>
        <TextArea label="Funding purpose / permitted use" name="fundingPurpose" rows={2} defaultValue={v.fundingPurpose} />
        <TextArea label="Funding terms" name="fundingTerms" rows={2} defaultValue={v.fundingTerms} />
        <TextArea label="Instalment percentages / amounts" name="installmentPlan" rows={2} defaultValue={v.installmentPlan} />
        <TextArea label="Milestones" name="milestones" rows={2} defaultValue={v.milestones} />
        <TextArea label="Expected payment schedule" name="paymentSchedule" rows={2} defaultValue={v.paymentSchedule} />
        <TextArea label="Approved conditions attached to disbursement" name="disbursementConditions" rows={2} defaultValue={v.disbursementConditions} />
        <Alert tone="info" title="Fees are disabled"><p>{NO_FEE_STATEMENT} There is no fee amount field: a legitimate fee would need a documented policy decision with legal/compliance review, outside this platform. Never request upfront payment to release an award.</p></Alert>
        <TextArea label="Fee policy note (internal)" name="feePolicyNote" rows={2} defaultValue={v.feePolicyNote} />
      </CardBody></Card>

      <Card><CardHeader title="Review process & terms" /><CardBody className="space-y-4">
        <TextArea label="Selection and review process" name="selectionProcess" rows={3} defaultValue={v.selectionProcess} />
        <TextField label="Expected decision timeline" name="decisionTimeline" defaultValue={v.decisionTimeline} />
        <TextArea label="Programme-specific terms" name="programmeTerms" rows={5} defaultValue={v.programmeTerms} />
        <CheckboxField name="termsApproved" defaultChecked={v.termsApproved} label="These terms have been approved by the organization" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Funding / partner organization" name="funderName" defaultValue={v.funderName} hint="Shown publicly only when marked verified." />
          <div className="flex items-end"><CheckboxField name="funderVerified" defaultChecked={v.funderVerified} label="This partner has been verified in writing" /></div>
        </div>
      </CardBody></Card>

      <Card><CardHeader title="Application questions" description="Steps 3–5 of the applicant form are built from these. Required questions must be answered before submission." /><CardBody className="space-y-4">
        {qs.length === 0 ? <p className="text-sm text-ink-600">No questions yet.</p> : null}
        <ol className="space-y-4">
          {qs.map((q, i) => (
            <li key={i} className="space-y-3 rounded-lg border border-ink-200 bg-sand-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">Question {i + 1}</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" aria-label={`Move question ${i + 1} up`} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
                  <Button size="sm" variant="ghost" aria-label={`Move question ${i + 1} down`} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
                  <Button size="sm" variant="ghost" aria-label={`Remove question ${i + 1}`} onClick={() => setQs((a) => a.filter((_, j) => j !== i))}><Trash2 className="size-4 text-bad-700" /></Button></div></div>
              <TextField label="Label" value={q.label} onChange={(e) => upd(i, { label: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectField label="Type" value={q.type} onChange={(e) => upd(i, { type: e.target.value })} options={QUESTION_TYPES.map((t) => ({ value: t, label: QUESTION_TYPE_LABELS[t] }))} />
                <SelectField label="Applicant-form step" value={q.section} onChange={(e) => upd(i, { section: e.target.value })} options={QUESTION_SECTIONS.map((s) => ({ value: s, label: s === "GENERAL" ? "Step 3 · Programme questions" : s === "PROJECT" ? "Step 4 · Project / purpose" : "Step 5 · Supporting" }))} />
                <TextField label="Key" value={q.key} onChange={(e) => upd(i, { key: e.target.value })} placeholder={keyFrom(q.label)} hint="Stable id; lowercase_underscores." />
              </div>
              {["SINGLE_CHOICE", "MULTI_CHOICE"].includes(q.type) ? <TextField label="Options (comma-separated, at least two)" value={q.options} onChange={(e) => upd(i, { options: e.target.value })} /> : null}
              <TextField label="Help text (optional)" value={q.helpText} onChange={(e) => upd(i, { helpText: e.target.value })} />
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={q.required} onChange={(e) => upd(i, { required: e.target.checked })} className="size-5 accent-teal-700" />Required</label>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setQs((a) => [...a, { key: "", label: "", helpText: "", type: "SHORT_TEXT", options: "", required: false, section: "GENERAL" }])}><Plus className="size-4" aria-hidden="true" /> Add question</Button>
          <Button variant="outline" onClick={() => setQs((a) => [...a, ...PROJECT_PRESETS.filter((p) => !a.some((q) => q.key === p.key)).map((p) => ({ key: p.key, label: p.label, helpText: p.help, type: p.type as string, options: "", required: false, section: "PROJECT" }))])}><Plus className="size-4" aria-hidden="true" /> Add project-proposal prompts</Button>
        </div>
      </CardBody></Card>

      <Card><CardHeader title="Frequently asked questions" /><CardBody className="space-y-3">
        {faq.map((f, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-ink-200 p-3">
            <TextField label={`Question ${i + 1}`} value={f.q} onChange={(e) => setFaq((a) => a.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
            <TextArea label="Answer" rows={2} value={f.a} onChange={(e) => setFaq((a) => a.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
            <Button size="sm" variant="ghost" onClick={() => setFaq((a) => a.filter((_, j) => j !== i))}><Trash2 className="size-4 text-bad-700" aria-hidden="true" /> Remove</Button>
          </div>))}
        <Button variant="outline" onClick={() => setFaq((a) => [...a, { q: "", a: "" }])}><Plus className="size-4" aria-hidden="true" /> Add FAQ</Button>
      </CardBody></Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-3 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur"><SubmitButton pending={pending} size="lg" pendingLabel="Saving…">{v.id ? "Save changes" : "Create opportunity (as draft)"}</SubmitButton></div>
    </form>
  );
}
