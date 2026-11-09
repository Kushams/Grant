import type { ReactNode } from "react";

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-ink-200 pt-6 first:border-0 first:pt-0">
      <h2 id={`${id}-h`} className="mb-3 text-2xl font-semibold">{title}</h2>
      <div className="space-y-3 text-ink-700">{children}</div>
    </section>
  );
}

export function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="italic text-ink-600">{empty}</p>;
  return <ul className="ml-5 list-disc space-y-1.5">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}
