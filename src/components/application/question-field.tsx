"use client";

import { useId } from "react";
import type { FieldError, UseFormRegister } from "react-hook-form";
import { Field } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import type { WizardQuestion, WizardValues } from "./types";

const control = "block w-full rounded-lg border border-ink-300 bg-surface px-3 py-2.5 text-base text-ink-900 shadow-sm focus:border-teal-600 aria-[invalid=true]:border-bad-700";

export function QuestionField({ q, register, error }: { q: WizardQuestion; register: UseFormRegister<WizardValues>; error?: FieldError | { message?: string } }) {
  const name = `answers.${q.key}` as const;
  const gid = useId();
  const errs = error?.message ? [String(error.message)] : undefined;
  const label = q.label;
  const required = q.required;

  if (q.type === "SINGLE_CHOICE" || q.type === "YES_NO" || q.type === "MULTI_CHOICE") {
    const multi = q.type === "MULTI_CHOICE";
    const options = q.type === "YES_NO" ? [{ value: "YES", label: "Yes" }, { value: "NO", label: "No" }] : q.optionList.map((o) => ({ value: o, label: o }));
    const hintId = q.helpText ? `${gid}-hint` : undefined;
    const errId = errs ? `${gid}-err` : undefined;
    return (
      <fieldset aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined} aria-required={required || undefined}>
        <legend className="text-sm font-semibold text-ink-900">{label}{required ? <span className="ml-1 text-bad-700" aria-hidden="true">*</span> : null}{required ? <span className="sr-only"> (required)</span> : null}</legend>
        {q.helpText ? <p id={hintId} className="mt-0.5 text-sm text-ink-600">{q.helpText}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((o) => (
            <label key={o.value} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-ink-300 bg-surface px-3 py-2 text-sm has-[:checked]:border-navy-700 has-[:checked]:bg-navy-50")}>
              <input type={multi ? "checkbox" : "radio"} value={o.value} {...register(name)} className="size-4 accent-navy-800" />
              {o.label}
            </label>
          ))}
        </div>
        {errs ? <p id={errId} className="mt-1 text-sm font-medium text-bad-700">{errs.join(" ")}</p> : null}
      </fieldset>
    );
  }

  return (
    <Field label={label} hint={q.helpText ?? undefined} error={errs} required={required}>
      {(a) => {
        const props = { id: a.id, "aria-required": required || undefined, "aria-describedby": a.describedBy, "aria-invalid": a.invalid || undefined, className: control };
        if (q.type === "LONG_TEXT" || q.type === "SUPPORTING_INFO") return <textarea rows={5} {...props} {...register(name)} className={cn(control, "resize-y")} />;
        if (q.type === "NUMBER") return <input type="text" inputMode="decimal" {...props} {...register(name)} />;
        if (q.type === "DATE") return <input type="date" {...props} {...register(name)} />;
        if (q.type === "URL") return <input type="url" placeholder="https://" {...props} {...register(name)} />;
        return <input type="text" {...props} {...register(name)} />;
      }}
    </Field>
  );
}
