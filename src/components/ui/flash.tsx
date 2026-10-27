"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Flash = { id: number; text: string };
export const FLASH_EVENT = "nen:flash";

/** Publishes a confirmation that survives the publishing form being unmounted by a re-render. */
export function publishFlash(text: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(FLASH_EVENT, { detail: { text } }));
}

/** Layout-level, polite live region. Only real, successful server results are ever published here. */
export function FlashRegion() {
  const [items, setItems] = useState<Flash[]>([]);
  useEffect(() => {
    let n = 0;
    const onFlash = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail.text;
      const id = ++n;
      setItems((a) => [...a.slice(-2), { id, text }]);
      window.setTimeout(() => setItems((a) => a.filter((x) => x.id !== id)), 10_000);
    };
    window.addEventListener(FLASH_EVENT, onFlash);
    return () => window.removeEventListener(FLASH_EVENT, onFlash);
  }, []);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {items.map((i) => (
        <div key={i.id} className="pointer-events-auto flex items-start gap-3 rounded-lg border border-ok-700/30 bg-surface p-3 text-sm font-medium text-ok-700 shadow-lg">
          <span className="flex-1">{i.text}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setItems((a) => a.filter((x) => x.id !== i.id))} className="rounded p-0.5 text-ink-600 hover:bg-ink-100"><X className="size-4" /></button>
        </div>
      ))}
    </div>
  );
}
