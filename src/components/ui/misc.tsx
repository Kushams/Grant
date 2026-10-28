import Link from "next/link";
import type { ReactNode } from "react";
import { Info, TriangleAlert, CircleCheck, CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spot } from "@/components/graphics/spots";
import { buttonClasses } from "./button";

const alertStyles = {
  info: { box: "border-info-700/25 bg-info-50 text-ink-900", icon: Info, color: "text-info-700" },
  warn: { box: "border-warn-700/30 bg-warn-50 text-ink-900", icon: TriangleAlert, color: "text-warn-700" },
  ok: { box: "border-ok-700/25 bg-ok-50 text-ink-900", icon: CircleCheck, color: "text-ok-700" },
  bad: { box: "border-bad-700/25 bg-bad-50 text-ink-900", icon: CircleAlert, color: "text-bad-700" },
};
export function Alert({ tone = "info", title, children, className }: { tone?: keyof typeof alertStyles; title?: string; children?: ReactNode; className?: string }) {
  const s = alertStyles[tone];
  const Icon = s.icon;
  return (
    <div role={tone === "bad" ? "alert" : "note"} className={cn("flex gap-3 rounded-lg border p-4 text-sm", s.box, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", s.color)} aria-hidden="true" />
      <div className="space-y-1">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className="text-ink-800">{children}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: { href: string; label: string }; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-300 bg-white/60 px-6 py-10 text-center">
      <div className="mb-3 text-navy-400" aria-hidden="true">{icon ?? <Spot name="document" className="size-14" />}</div>
      <p className="font-display text-lg font-semibold text-navy-900">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-ink-600">{description}</p> : null}
      {action ? <Link href={action.href} className={buttonClasses("primary", "md", "mt-4")}>{action.label}</Link> : null}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-ink-800">{label}</span><span className="text-ink-600">{v}%</span></div>
      <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2.5 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function Stat({ label, value, hint, href, tone = "navy" }: { label: string; value: ReactNode; hint?: string; href?: string; tone?: "navy" | "teal" | "warn" | "bad" }) {
  const accent = { navy: "border-l-navy-700", teal: "border-l-teal-600", warn: "border-l-warn-700", bad: "border-l-bad-700" }[tone];
  const body = (
    <div className={cn("h-full rounded-lg border border-ink-200 border-l-4 bg-white p-4 shadow-[var(--shadow-card)]", accent, href && "transition-colors hover:bg-navy-50/40")}>
      <p className="text-sm font-medium text-ink-600">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-navy-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-600">{hint}</p> : null}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export function PageHeader({ title, description, actions, eyebrow, icon }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: string; icon?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-3xl items-end gap-5">
      {icon ? <div className="hidden self-start sm:block">{icon}</div> : null}
      <div className="flex-1">
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-wider text-teal-700">{eyebrow}</p> : null}
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-base text-ink-600">{description}</p> : null}
      </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Renders "Details to be confirmed" instead of inventing a fact. */
export function Unconfirmed({ children }: { children?: ReactNode }) {
  return children ? <>{children}</> : <span className="italic text-ink-600">Details to be confirmed</span>;
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  const link = "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold";
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? <Link href={hrefFor(page - 1)} className={cn(link, "border-ink-300 bg-white")} rel="prev">Previous</Link> : null}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - nums[i - 1] > 1 ? <span aria-hidden="true">…</span> : null}
          <Link href={hrefFor(n)} aria-current={n === page ? "page" : undefined} className={cn(link, n === page ? "border-navy-800 bg-navy-800 text-white" : "border-ink-300 bg-white")}>{n}</Link>
        </span>
      ))}
      {page < pages ? <Link href={hrefFor(page + 1)} className={cn(link, "border-ink-300 bg-white")} rel="next">Next</Link> : null}
    </nav>
  );
}

export function DefinitionList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-ink-600">{i.label}</dt>
          <dd className="mt-0.5 text-ink-900">{i.value ?? <Unconfirmed />}</dd>
        </div>
      ))}
    </dl>
  );
}
