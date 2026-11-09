"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Download, KeyRound } from "lucide-react";
import { startQuickAccountAction } from "@/app/actions/auth";
import { useActionForm } from "@/lib/use-action-form";
import { addPasskey } from "@/lib/passkey-client";
import { Button, LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { CheckboxField, FormMessage, SubmitButton, TextField, fe } from "@/components/ui/form";

export function QuickStartForm({ signedIn = false }: { signedIn?: boolean }) {
  const { state, onSubmit, pending } = useActionForm(startQuickAccountAction);
  const code = typeof state?.data?.code === "string" ? state.data.code : null;
  const [passkeyMsg, setPasskeyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (code) {
    const download = () => {
      const url = URL.createObjectURL(new Blob([`National Empowerment Network access code\n\n${code}\n\nKeep this somewhere private. Anyone with this code can open your dashboard.\n`], { type: "text/plain" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: "nen-access-code.txt" });
      a.click();
      URL.revokeObjectURL(url);
    };
    return (
      <div className="space-y-6" data-testid="access-code-panel">
        <Alert tone="warn" title="Save your access code now">
          This is the only time it is shown. It lets you sign in if you lose your device. Anyone who has it can open your dashboard, so keep it private.
        </Alert>
        <p className="select-all rounded-xl border border-ink-300 bg-white px-4 py-5 text-center font-mono text-2xl font-semibold tracking-wider text-navy-900" aria-label="Your access code">{code}</p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={async () => { await navigator.clipboard?.writeText(code).catch(() => undefined); setCopied(true); }}><Copy className="size-4" aria-hidden="true" /> {copied ? "Copied" : "Copy"}</Button>
          <Button type="button" variant="outline" onClick={download}><Download className="size-4" aria-hidden="true" /> Download</Button>
        </div>
        <div className="space-y-3 rounded-xl border border-ink-200 bg-sand-100 p-4">
          <p className="font-semibold text-ink-900">Next time, sign in with one tap</p>
          <p className="text-sm text-ink-700">Add a passkey to this device and you will not need the code day to day.</p>
          <Button type="button" disabled={busy || passkeyMsg?.ok} onClick={async () => { setBusy(true); const r = await addPasskey("This device"); setPasskeyMsg({ ok: r.ok, text: r.ok ? "Passkey added to this device." : r.message ?? "Could not add a passkey." }); setBusy(false); }}>
            <KeyRound className="size-4" aria-hidden="true" /> {busy ? "Waiting for your device…" : "Add a passkey"}
          </Button>
          <p role="status" aria-live="polite" className={passkeyMsg?.ok ? "text-sm font-medium text-ok-700" : "text-sm font-medium text-bad-700"}>{passkeyMsg?.text}</p>
        </div>
        <LinkButton href="/dashboard" size="lg" className="w-full">Continue to my dashboard</LinkButton>
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="space-y-4">
        <p className="text-ink-700">You are already signed in.</p>
        <LinkButton href="/dashboard" size="lg" className="w-full">Go to my dashboard</LinkButton>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <TextField label="Your name" name="name" autoComplete="name" required error={fe(state, "name")} hint="As you would like it to appear on an application." />
      <CheckboxField name="consentPrivacy" error={fe(state, "consentPrivacy")}
        label={<>I have read the <Link href="/privacy" className="font-semibold underline" target="_blank">privacy notice</Link> and understand how my information is used.</>} />
      <SubmitButton pending={pending} className="w-full" size="lg" pendingLabel="Creating…">Create my account</SubmitButton>
    </form>
  );
}
