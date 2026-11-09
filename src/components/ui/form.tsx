"use client";

import { useFormStatus } from "react-dom";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import type { ActionState } from "@/lib/action";

const control =
  "block w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-base text-ink-900 placeholder:text-ink-500 shadow-sm " +
  "focus:border-teal-600 disabled:bg-ink-50 aria-[invalid=true]:border-bad-700";

export function Field({
  label, hint, error, required, children, htmlFor,
}: { label: string; hint?: string; error?: string[]; required?: boolean; children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode; htmlFor?: string }) {
  const generated = useId();
  const id = htmlFor ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error?.length ? `${id}-err` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink-900">
        {label}
        {required ? <span className="ml-1 text-bad-700" aria-hidden="true">*</span> : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {children({ id, describedBy: [hintId, errId].filter(Boolean).join(" ") || undefined, invalid: !!error?.length })}
      {hint ? <p id={hintId} className="text-sm text-ink-600">{hint}</p> : null}
      {error?.length ? <p id={errId} className="text-sm font-medium text-bad-700">{error.join(" ")}</p> : null}
    </div>
  );
}

type TextProps = ComponentProps<"input"> & { label: string; hint?: string; error?: string[] };
export function TextField({ label, hint, error, required, className, id, ...props }: TextProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      {(a) => <input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid || undefined} required={required} className={cn(control, className)} {...props} />}
    </Field>
  );
}

type AreaProps = ComponentProps<"textarea"> & { label: string; hint?: string; error?: string[] };
export function TextArea({ label, hint, error, required, className, id, rows = 4, ...props }: AreaProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      {(a) => <textarea id={a.id} rows={rows} aria-describedby={a.describedBy} aria-invalid={a.invalid || undefined} required={required} className={cn(control, "resize-y", className)} {...props} />}
    </Field>
  );
}

type SelectProps = ComponentProps<"select"> & { label: string; hint?: string; error?: string[]; options: Array<{ value: string; label: string }>; placeholder?: string };
export function SelectField({ label, hint, error, required, className, id, options, placeholder, ...props }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      {(a) => (
        <select id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid || undefined} required={required} className={cn(control, "pr-8", className)} {...props}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

export function CheckboxField({ label, hint, error, className, id, ...props }: ComponentProps<"input"> & { label: ReactNode; hint?: string; error?: string[] }) {
  const generated = useId();
  const cid = id ?? generated;
  const errId = error?.length ? `${cid}-err` : undefined;
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-start gap-3">
        <input id={cid} type="checkbox" aria-describedby={errId} aria-invalid={!!error?.length || undefined} className="mt-1 size-5 shrink-0 rounded border-ink-300 accent-teal-700" {...props} />
        <label htmlFor={cid} className="text-sm text-ink-800">{label}</label>
      </div>
      {hint ? <p className="pl-8 text-sm text-ink-600">{hint}</p> : null}
      {error?.length ? <p id={errId} className="pl-8 text-sm font-medium text-bad-700">{error.join(" ")}</p> : null}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel = "Saving…", pending: pendingProp, ...props }: ComponentProps<typeof Button> & { pendingLabel?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" {...props} disabled={pending || props.disabled} aria-disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

/** Screen-reader-friendly status region. Only announces results of REAL server responses. */
export function FormMessage({ state, successFallback }: { state: ActionState; successFallback?: string }) {
  const text = state ? (state.message ?? (state.ok ? successFallback : undefined)) : undefined;
  return (
    <div aria-live="polite" role="status" className="min-h-0">
      {text ? (
        <p className={cn("rounded-lg border px-4 py-3 text-sm font-medium", state?.ok ? "border-ok-700/30 bg-ok-50 text-ok-700" : "border-bad-700/30 bg-bad-50 text-bad-700")} role={state?.ok ? "status" : "alert"}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

export const fe = (state: ActionState, key: string): string[] | undefined => state?.fieldErrors?.[key];
