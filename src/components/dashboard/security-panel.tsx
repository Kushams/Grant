"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { issueAccessCodeAction, removePasskeyAction, revokeAccessCodeAction } from "@/app/actions/security";
import { addPasskey, passkeysSupported } from "@/lib/passkey-client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";

type Key = { id: string; label: string | null; createdAt: string; lastUsedAt: string | null };

export function SecurityPanel({ passkeys, hasAccessCode, canUseCode }: { passkeys: Key[]; hasAccessCode: boolean; canUseCode: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const done = (ok: boolean, text: string) => { setMsg({ ok, text }); router.refresh(); };

  return (
    <div className="space-y-8">
      {msg ? <Alert tone={msg.ok ? "ok" : "bad"}>{msg.text}</Alert> : null}

      <section aria-labelledby="pk-h" className="space-y-4">
        <h2 id="pk-h" className="flex items-center gap-2 text-xl font-semibold"><KeyRound className="size-5 text-navy-500" aria-hidden="true" /> Passkeys</h2>
        <p className="text-sm text-ink-700">A passkey lets you sign in with your fingerprint, face or device unlock — no email or password.</p>
        {passkeys.length === 0 ? <p className="text-sm italic text-ink-600">No passkeys yet.</p> : (
          <ul className="divide-y divide-ink-200 rounded-xl border border-ink-200 bg-white">
            {passkeys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-ink-900">{k.label ?? "Passkey"}</p>
                  <p className="text-xs text-ink-600">Added {new Date(k.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}{k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}` : ""}</p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={pending}
                  onClick={() => start(async () => { const fd = new FormData(); fd.set("id", k.id); const r = await removePasskeyAction(null, fd); done(!!r?.ok, r?.message ?? "Done."); })}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
        <Button type="button" disabled={pending}
          onClick={() => start(async () => {
            if (!passkeysSupported()) { done(false, "This browser or device does not support passkeys."); return; }
            const r = await addPasskey(/Android|iPhone|iPad/i.test(navigator.userAgent) ? "Phone" : "This device");
            done(r.ok, r.ok ? "Passkey added." : r.message ?? "Could not add a passkey.");
          })}>Add a passkey on this device</Button>
      </section>

      {canUseCode ? (
        <section aria-labelledby="ac-h" className="space-y-4">
          <h2 id="ac-h" className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-5 text-navy-500" aria-hidden="true" /> Access code</h2>
          <p className="text-sm text-ink-700">A backup way to sign in if you lose your device. {hasAccessCode ? "You have an access code. We cannot show it again, but you can create a new one — the old one then stops working." : "You do not have one yet."}</p>
          {code ? (
            <div className="space-y-2" data-testid="access-code-panel">
              <Alert tone="warn" title="Save this code now — it is shown only once" />
              <p className="select-all rounded-xl border border-ink-300 bg-white px-4 py-4 text-center font-mono text-xl font-semibold tracking-wider text-navy-900">{code}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" disabled={pending}
              onClick={() => start(async () => { const r = await issueAccessCodeAction(); if (r?.ok && typeof r.data?.code === "string") setCode(r.data.code); done(!!r?.ok, r?.message ?? "Done."); })}>{hasAccessCode ? "Create a new access code" : "Create an access code"}</Button>
            {hasAccessCode ? <Button type="button" variant="outline" disabled={pending}
              onClick={() => start(async () => { const r = await revokeAccessCodeAction(); setCode(null); done(!!r?.ok, r?.message ?? "Done."); })}>Remove access code</Button> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
