"use client";

import { useRef, type ReactNode } from "react";
import { useActionForm } from "@/lib/use-action-form";
import { publishFlash } from "./flash";
import type { ActionState } from "@/lib/action";
import { FormMessage, SubmitButton } from "./form";
import type { ComponentProps } from "react";

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  variant?: ComponentProps<typeof SubmitButton>["variant"];
  className?: string;
  hidden?: Record<string, string>;
  size?: "sm" | "md" | "lg";
};

/** Compact form wrapper for admin actions: shows the server's real result and any field errors. */
export function ActionForm({ action, children, submitLabel, pendingLabel, variant = "primary", className, hidden, size = "md" }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  // Successes go to the layout-level flash region. Publishing happens in the wrapped action — before React
  // applies the new state — because the re-rendered page may remove this form entirely.
  const { state, onSubmit, pending } = useActionForm(async (prev, fd) => {
    const result = await action(prev, fd);
    if (result?.ok && result.message) {
      publishFlash(result.message);
      ref.current?.reset(); // clear on success only; on error the user's input is kept
    }
    return result;
  });
  const details = state && !state.ok ? Object.values(state.fieldErrors ?? {}).flat() : [];
  return (
    <form ref={ref} onSubmit={onSubmit} className={className ?? "space-y-3"}>
      {hidden ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />) : null}
      {state && !state.ok ? <FormMessage state={state} /> : null}
      {details.length ? <ul className="list-disc pl-5 text-sm text-bad-700">{details.map((d, i) => <li key={i}>{d}</li>)}</ul> : null}
      {children}
      <SubmitButton variant={variant} size={size} pendingLabel={pendingLabel} pending={pending}>{submitLabel}</SubmitButton>
    </form>
  );
}
