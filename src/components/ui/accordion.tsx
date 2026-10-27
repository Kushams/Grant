"use client";

import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

export type AccordionItem = { title: string; content: ReactNode };

/** Accessible accordion (button + region, aria-expanded). Height animates in CSS; reduced motion disables it. Pattern adapted from the World Bridge Meridian site. */
export function Accordion({ items, multiple = false, className = "" }: { items: AccordionItem[]; multiple?: boolean; className?: string }) {
  const base = useId();
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) => setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : multiple ? [...cur, i] : [i]));
  return (
    <div className={`divide-y divide-ink-200 rounded-xl border border-ink-200 bg-white shadow-[var(--shadow-card)] ${className}`}>
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        const id = `${base}-${i}`;
        return (
          <div key={item.title}>
            <h3 className="font-sans text-base font-semibold tracking-normal">
              <button type="button" id={`${id}-b`} aria-expanded={isOpen} aria-controls={`${id}-p`} onClick={() => toggle(i)} className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left text-ink-900">
                <span>{item.title}</span>
                <Plus aria-hidden="true" className={`size-5 shrink-0 text-teal-700 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-45" : ""}`} />
              </button>
            </h3>
            <div id={`${id}-p`} role="region" aria-labelledby={`${id}-b`} data-open={isOpen} className="acc-panel" hidden={false} inert={!isOpen}>
              <div><div className="px-5 pb-5 text-ink-700">{item.content}</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
