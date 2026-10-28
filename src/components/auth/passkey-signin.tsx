"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { accessCodeLoginAction } from "@/app/actions/auth";
import { useActionForm } from "@/lib/use-action-form";
import { signInWithPasskey } from "@/lib/passkey-client";
import { Button } from "@/components/ui/button";
import { FormMessage, SubmitButton, TextField, fe } from "@/components/ui/form";

/** One-tap sign-in with a passkey (fingerprint, face or device unlock). No email or password. */
export function PasskeySignIn({ next }: { next?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function go() {
    setBusy(true);
    setMsg(null);
    const r = await signInWithPasskey(next);
    if (r.ok && r.redirectTo) { window.location.assign(r.redirectTo); return; }
    setMsg(r.message ?? "Sign-in did not complete.");
    setBusy(false);
  }
  return (
    <div className="space-y-2">
      <Button type="button" size="lg" className="w-full" onClick={go} disabled={busy}>
        <KeyRound className="size-5" aria-hidden="true" /> {busy ? "Waiting for your device…" : "Sign in with a passkey"}
      </Button>
      <p className="text-center text-xs text-ink-600">Use your fingerprint, face or device unlock. No email or password needed.</p>
      <p role="status" aria-live="polite" className="text-center text-sm font-medium text-bad-700">{msg}</p>
    </div>
  );
}

export function AccessCodeForm({ next }: { next?: string }) {
  const { state, onSubmit, pending } = useActionForm(accessCodeLoginAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage state={state} />
      <TextField label="Access code" name="code" autoComplete="off" autoCapitalize="characters" spellCheck={false} required placeholder="NEN-XXXX-XXXX-XXXX-XXXX"
        error={fe(state, "code")} hint="The code shown when your account was created." className="font-mono" />
      <SubmitButton pending={pending} variant="secondary" className="w-full" pendingLabel="Checking…">Sign in with access code</SubmitButton>
    </form>
  );
}
