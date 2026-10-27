"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { saveStepAction, submitApplicationAction } from "@/app/actions/applicant";
import { assessCompleteness } from "@/lib/completeness";
import { buildAnswersSchema } from "@/lib/validation/application";
import { parseAmountToMinor } from "@/lib/money";
import { APPLICANT_TYPE_LABELS, INDIVIDUAL_CATEGORIES, type ApplicantType } from "@/lib/constants";
import { NO_FEE_STATEMENT, NO_GUARANTEE_STATEMENT } from "@/config/organization";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Alert, ProgressBar } from "@/components/ui/misc";
import { CheckboxField, TextField } from "@/components/ui/form";
import { DemoBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { QuestionField } from "./question-field";
import type { WizardProps, WizardQuestion, WizardValues } from "./types";

const STEP_TITLES = ["Applicant type", "Your profile", "Programme questions", "Project or purpose", "Supporting material", "Review & consent"];

function toDefaults(p: WizardProps): WizardValues {
  const answers: WizardValues["answers"] = {};
  for (const q of p.opportunity.questions) {
    const raw = p.answers[q.key];
    if (q.type === "MULTI_CHOICE") {
      try { answers[q.key] = raw ? (JSON.parse(raw) as string[]) : []; } catch { answers[q.key] = []; }
    } else answers[q.key] = raw ?? "";
  }
  return { category: p.category, organizationId: p.organizationId, answers, requestedAmount: p.requestedAmount, consentAccepted: false, consentTerms: false };
}

const asString = (v: string | string[] | undefined): string => (Array.isArray(v) ? (v.length ? JSON.stringify(v) : "") : (v ?? "").trim());
const display = (q: WizardQuestion, v: string | string[] | undefined): string => {
  const s = asString(v);
  if (!s || s === "[]") return "—";
  if (q.type === "MULTI_CHOICE") { try { return (JSON.parse(s) as string[]).join(", "); } catch { return s; } }
  return q.type === "YES_NO" ? (s === "YES" ? "Yes" : "No") : s;
};

export function ApplicationWizard(p: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(p.startStep, 1), 6));
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ ok: boolean; text: string; lines?: string[] } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opp = p.opportunity;

  const schema = useMemo(() => buildAnswersSchema(opp.questions.map((q) => ({ ...q, options: q.optionList }))), [opp.questions]);
  const form = useForm<WizardValues>({ defaultValues: toDefaults(p), resolver: zodResolver(schema) as never, mode: "onBlur" });
  const { register, getValues, setError, clearErrors, trigger, reset, formState, control } = form;
  const { errors, isDirty } = formState;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isDirty]);
  useEffect(() => { heading.current?.focus(); }, [step]);

  const sectionQs = (section: string) => opp.questions.filter((q) => q.section === section);
  const stepSection = step === 3 ? "GENERAL" : step === 4 ? "PROJECT" : step === 5 ? "SUPPORTING" : null;

  function payloadFor(s: number) {
    const v = getValues();
    if (s === 1) return { applicantCategory: v.category, organizationId: v.organizationId || undefined };
    const section = s === 3 ? "GENERAL" : s === 4 ? "PROJECT" : s === 5 ? "SUPPORTING" : null;
    if (!section) return {};
    const answers: Record<string, unknown> = {};
    for (const q of sectionQs(section)) answers[q.key] = v.answers[q.key] ?? "";
    return { answers, ...(s === 4 && opp.fundingSpecified && opp.fixedAmountMinor == null ? { requestedAmount: v.requestedAmount } : {}) };
  }

  /** Validate (types only) then persist the current step on the server, then move to `next`. */
  async function saveAndGo(next: number) {
    setBanner(null);
    clearErrors();
    if (stepSection) {
      const names = sectionQs(stepSection).map((q) => `answers.${q.key}` as const);
      const ok = await trigger(names);
      if (!ok) { setBanner({ ok: false, text: "Please fix the highlighted answers before continuing." }); return false; }
    }
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const res = await saveStepAction(p.applicationId, step, next, payloadFor(step) as never);
        if (!res?.ok) {
          for (const [key, msgs] of Object.entries(res?.fieldErrors ?? {})) {
            const field = key === "requestedAmount" ? "requestedAmount" : key.startsWith("answers.") ? key : null;
            if (field) setError(field as never, { message: msgs.join(" ") });
          }
          setBanner({ ok: false, text: res?.message ?? "Could not save." });
          resolve(false);
          return;
        }
        reset(getValues());
        setLastSaved(new Date());
        setStep(next);
        resolve(true);
      });
    });
  }

  const watched = useWatch({ control }) as WizardValues;
  const answerStrings = Object.fromEntries(opp.questions.map((q) => [q.key, asString(watched.answers?.[q.key])]));
  const requestedMinor = watched.requestedAmount ? parseAmountToMinor(watched.requestedAmount, opp.currency) : null;
  const completeness = assessCompleteness({ questions: opp.questions, fundingSpecified: opp.fundingSpecified, fixedAmountMinor: opp.fixedAmountMinor, requireProposal: opp.requireProposal }, answerStrings, { requestedAmountMinor: requestedMinor });

  function submit() {
    setBanner(null);
    const v = getValues();
    startTransition(async () => {
      const res = await submitApplicationAction(p.applicationId, { consentAccepted: v.consentAccepted, consentTerms: v.consentTerms });
      if (res?.ok && res.redirectTo) { reset(getValues()); router.push(res.redirectTo); return; }
      const lines = Object.values(res?.fieldErrors ?? {}).flat();
      setBanner({ ok: false, text: res?.message ?? "Could not submit.", lines });
    });
  }

  const acceptedCategory = (c: string) => opp.acceptedTypes.includes(c);
  const org = p.organizations.find((o) => o.id === watched.organizationId) ?? p.organizations[0];
  const profileReady = p.mode === "INDIVIDUAL" ? !!p.individual?.ready : !!org?.ready;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">{opp.isDemo ? <DemoBadge /> : null}<span className="text-sm text-ink-600">{opp.reference}</span></div>
        <h1 className="text-3xl font-semibold">Apply: {opp.title}</h1>
        <p className="text-sm text-ink-600">{p.reference ? `Reference ${p.reference}` : "Draft — your reference number is issued when you submit."} · {p.status === "RESUBMISSION_REQUIRED" ? "Revision requested" : "Draft saved automatically when you continue"}</p>
        <ProgressBar label="Required information complete" value={completeness.percent} />
      </header>

      {p.revisionNote ? <Alert tone="warn" title="Changes requested by the review team"><p className="whitespace-pre-line">{p.revisionNote}</p></Alert> : null}

      <nav aria-label="Application steps">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {STEP_TITLES.map((t, i) => {
            const n = i + 1;
            return (
              <li key={t}>
                <button type="button" disabled={pending} onClick={() => n !== step && saveAndGo(n)} aria-current={n === step ? "step" : undefined}
                  className={cn("flex min-h-12 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold", n === step ? "border-navy-800 bg-navy-800 text-white" : "border-ink-300 bg-white text-ink-800 hover:bg-ink-50", n < step && "border-teal-600")}>
                  <span aria-hidden="true" className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs", n === step ? "bg-white text-navy-900" : n < step ? "bg-teal-600 text-white" : "bg-ink-100 text-ink-700")}>{n < step ? <Check className="size-3.5" /> : n}</span>
                  <span><span className="sr-only">Step {n}: </span>{t}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div aria-live="polite" role="status">
        {banner ? (
          <div className={cn("rounded-lg border p-4 text-sm", banner.ok ? "border-ok-700/30 bg-ok-50 text-ok-700" : "border-bad-700/30 bg-bad-50 text-bad-700")} role={banner.ok ? "status" : "alert"}>
            <p className="font-semibold">{banner.text}</p>
            {banner.lines?.length ? <ul className="mt-1 list-disc pl-5">{banner.lines.map((l) => <li key={l}>{l}</li>)}</ul> : null}
          </div>
        ) : null}
      </div>

      <Card><CardBody>
        <h2 ref={heading} tabIndex={-1} className="mb-5 text-2xl font-semibold outline-none">Step {step} of 6 — {STEP_TITLES[step - 1]}</h2>

        {step === 1 ? (
          <div className="space-y-5">
            {p.mode === "INDIVIDUAL" ? (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-ink-900">How are you applying?</legend>
                <p className="text-sm text-ink-600">Your account is an individual account, so you apply as yourself. Organizations and businesses apply from an organization account.</p>
                {INDIVIDUAL_CATEGORIES.map((c) => {
                  const ok = acceptedCategory(c);
                  return (
                    <label key={c} className={cn("flex items-start gap-3 rounded-lg border p-4", ok ? "cursor-pointer border-ink-300 bg-white has-[:checked]:border-navy-700 has-[:checked]:bg-navy-50" : "border-ink-200 bg-ink-50 text-ink-600")}>
                      <input type="radio" value={c} disabled={!ok} {...register("category")} className="mt-1 size-4 accent-navy-800" />
                      <span><span className="block font-semibold">{APPLICANT_TYPE_LABELS[c as ApplicantType]}</span><span className="block text-sm">{ok ? "Accepted by this programme." : "Not accepted by this programme."}</span></span>
                    </label>
                  );
                })}
              </fieldset>
            ) : (
              <div className="space-y-4">
                {p.organizations.length > 1 ? (
                  <div>
                    <label htmlFor="org-select" className="text-sm font-semibold text-ink-900">Which organization is applying?</label>
                    <select id="org-select" {...register("organizationId")} className="mt-1 block w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5">
                      {p.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                ) : null}
                {org ? <div className="rounded-lg border border-ink-200 bg-sand-50 p-4 text-sm"><p><strong>{org.name}</strong></p><p>Organization type: {APPLICANT_TYPE_LABELS[org.type as ApplicantType] ?? org.type}</p><p className={acceptedCategory(org.type) ? "text-ok-700" : "text-bad-700"}>{acceptedCategory(org.type) ? "✓ This type is accepted by the programme." : "✗ This type is not accepted by the programme."}</p></div> : null}
                <p className="text-sm text-ink-600">The organization type comes from your organization profile. You can only apply for organizations you belong to.</p>
              </div>
            )}
            <p className="text-sm text-ink-600">Accepted by this programme: {opp.acceptedTypes.map((t) => APPLICANT_TYPE_LABELS[t as ApplicantType] ?? t).join(", ") || "to be confirmed"}.</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <p className="text-ink-700">Reviewers will see this saved profile summary with your application. We don’t collect ID numbers, bank details or other sensitive data.</p>
            {p.mode === "INDIVIDUAL" && p.individual ? (
              <dl className="grid gap-3 rounded-lg border border-ink-200 bg-sand-50 p-4 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold">Name</dt><dd>{p.individual.fullName}</dd></div>
                <div><dt className="font-semibold">Country or region</dt><dd>{p.individual.country ?? "Not added"}</dd></div>
                <div><dt className="font-semibold">City</dt><dd>{p.individual.city ?? "Not added"}</dd></div>
              </dl>
            ) : org ? (
              <dl className="grid gap-3 rounded-lg border border-ink-200 bg-sand-50 p-4 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold">Organization</dt><dd>{org.name}</dd></div>
                <div><dt className="font-semibold">Country or region</dt><dd>{org.country ?? "Not added"}</dd></div>
                <div><dt className="font-semibold">Public contact email</dt><dd>{org.contactEmail ?? "Not added"}</dd></div>
              </dl>
            ) : null}
            {profileReady ? <p className="text-sm font-semibold text-ok-700">✓ Your profile has the minimum information needed to apply.</p>
              : <Alert tone="warn" title="Complete your profile to submit">Add the missing details, then return — your draft is saved. <Link className="font-semibold underline" href="/dashboard/profile">Edit profile</Link></Alert>}
            <p className="text-sm"><Link href="/dashboard/profile" className="font-semibold text-navy-800 underline">Edit profile</Link> (your draft stays saved).</p>
          </div>
        ) : null}

        {stepSection ? (
          <div className="space-y-6">
            {step === 3 ? <p className="text-sm text-ink-600">Fields marked * are required to submit. You can leave and return — progress saves each time you continue.</p> : null}
            {step === 4 ? (
              <>
                {opp.questions.some((q) => q.section === "PROJECT") ? null : <p className="text-ink-700">This programme does not ask for a project proposal.</p>}
                {opp.fundingSpecified && opp.fixedAmountMinor == null ? (
                  <TextField label={`Amount requested (${opp.currency})`} inputMode="decimal" {...register("requestedAmount")} required={opp.requireProposal}
                    hint={`Programme range: ${opp.fundingText ?? "to be confirmed"}. This is a request, not a promise of funding.`} error={errors.requestedAmount?.message ? [String(errors.requestedAmount.message)] : undefined} />
                ) : opp.fixedAmountMinor != null ? <Alert tone="info">This programme states a fixed award amount ({opp.fundingText}). It is not guaranteed.</Alert> : null}
              </>
            ) : null}
            {step === 5 ? (
              <Alert tone="info" title="No files or sensitive documents">
                File uploads are switched off in this prototype. Please don’t paste ID numbers, bank statements or card details into any field.
                {opp.requiredDocs.length ? <> Documents this opportunity lists ({opp.requiredDocs.join("; ")}) are <strong>not collected</strong> in the prototype.</> : null}
              </Alert>
            ) : null}
            {sectionQs(stepSection).map((q) => <QuestionField key={q.key} q={q} register={register} error={errors.answers?.[q.key] as { message?: string } | undefined} />)}
            {sectionQs(stepSection).length === 0 && step !== 4 ? <p className="text-ink-700">There are no questions in this section for this programme. Continue to the next step.</p> : null}
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-6">
            {completeness.missing.length || completeness.invalid.length ? (
              <Alert tone="warn" title="A few things need attention before you can submit">
                <ul className="mt-1 list-disc pl-5">
                  {completeness.missing.map((m) => <li key={m.label}>Required: {m.label} — <button type="button" className="font-semibold underline" onClick={() => saveAndGo(m.step)}>go to step {m.step}</button></li>)}
                  {completeness.invalid.map((m) => <li key={m.label}>{m.label}: {m.message} — <button type="button" className="font-semibold underline" onClick={() => saveAndGo(m.step)}>go to step {m.step}</button></li>)}
                </ul>
              </Alert>
            ) : <Alert tone="ok" title="Everything required is filled in">Review your answers below, then confirm and submit.</Alert>}

            <section aria-labelledby="sum-h">
              <h3 id="sum-h" className="mb-3 font-sans text-base font-bold tracking-normal text-navy-900">Summary</h3>
              <dl className="space-y-3 text-sm">
                <div><dt className="font-semibold">Applying as</dt><dd>{p.mode === "ORGANIZATION" && org ? `${org.name} (${APPLICANT_TYPE_LABELS[org.type as ApplicantType] ?? org.type})` : APPLICANT_TYPE_LABELS[watched.category as ApplicantType] ?? watched.category}</dd></div>
                {opp.fundingSpecified && opp.fixedAmountMinor == null ? <div><dt className="font-semibold">Amount requested</dt><dd>{watched.requestedAmount ? `${opp.currency} ${watched.requestedAmount}` : "—"}</dd></div> : null}
                {opp.questions.map((q) => <div key={q.key}><dt className="font-semibold">{q.label}</dt><dd className="whitespace-pre-line text-ink-700">{display(q, watched.answers?.[q.key])}</dd></div>)}
              </dl>
            </section>

            <fieldset className="space-y-3 rounded-lg border border-ink-200 bg-sand-50 p-4">
              <legend className="px-1 text-sm font-semibold text-ink-900">Confirmations (neither is pre-selected)</legend>
              <CheckboxField {...register("consentAccepted")} label={<>I confirm the information I have given is accurate to the best of my knowledge, and I have read the <Link href="/privacy" target="_blank" className="font-semibold underline">draft privacy notice</Link>.</>} />
              <CheckboxField {...register("consentTerms")} label={<>I have read the {opp.hasTerms ? <Link href={`/opportunities/${opp.slug}#terms`} target="_blank" className="font-semibold underline">programme terms</Link> : "programme terms"} and understand that applying does not guarantee approval or payment.</>} />
              <p className="text-xs text-ink-600">{NO_GUARANTEE_STATEMENT} {NO_FEE_STATEMENT}</p>
            </fieldset>
          </div>
        ) : null}
      </CardBody></Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={pending || step === 1} onClick={() => saveAndGo(step - 1)}><ArrowLeft className="size-4" aria-hidden="true" /> Back</Button>
          {step !== 6 ? <Button variant="ghost" disabled={pending} onClick={() => saveAndGo(step)}><Save className="size-4" aria-hidden="true" /> Save draft</Button> : null}
          <span className="text-xs text-ink-600" aria-live="polite">{isDirty ? "Unsaved changes" : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : ""}</span>
        </div>
        {step < 6 ? (
          <Button variant="primary" disabled={pending} onClick={() => saveAndGo(step + 1)}>{pending ? "Saving…" : "Save & continue"} <ArrowRight className="size-4" aria-hidden="true" /></Button>
        ) : (
          <Button variant="accent" size="lg" disabled={pending} onClick={submit}>{pending ? "Submitting…" : p.status === "RESUBMISSION_REQUIRED" ? "Resubmit application" : "Submit application"}</Button>
        )}
      </div>
    </div>
  );
}
