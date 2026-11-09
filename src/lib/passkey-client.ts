"use client";

import { startAuthentication, startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";

export const passkeysSupported = () => typeof window !== "undefined" && browserSupportsWebAuthn();

async function post<T>(url: string, body?: unknown): Promise<T & { ok: boolean; message?: string }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  return res.json();
}

function friendly(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "AbortError") return "That was cancelled. Nothing was changed.";
  if (name === "InvalidStateError") return "This device already has a passkey for your account.";
  return "Your device could not complete that. Please try again, or use your access code.";
}

export async function addPasskey(label?: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const o = await post<{ options: Parameters<typeof startRegistration>[0]["optionsJSON"]; token: string }>("/api/auth/passkey/register/options");
    if (!o.ok) return { ok: false, message: o.message };
    const response = await startRegistration({ optionsJSON: o.options });
    return await post("/api/auth/passkey/register/verify", { token: o.token, response, label });
  } catch (e) { return { ok: false, message: friendly(e) }; }
}

export async function signInWithPasskey(next?: string): Promise<{ ok: boolean; message?: string; redirectTo?: string }> {
  try {
    const o = await post<{ options: Parameters<typeof startAuthentication>[0]["optionsJSON"]; token: string }>("/api/auth/passkey/login/options");
    if (!o.ok) return { ok: false, message: o.message };
    const response = await startAuthentication({ optionsJSON: o.options });
    return await post("/api/auth/passkey/login/verify", { token: o.token, response, next });
  } catch (e) { return { ok: false, message: friendly(e) }; }
}
