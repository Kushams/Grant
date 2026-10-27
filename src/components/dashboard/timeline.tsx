import { STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badge";

export type TimelineEvent = { toStatus: string; publicNote: string | null; createdAt: Date; by?: string | null };

/** Chronological, accessible timeline. Applicant callers only pass publicNote (never internal notes). */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-ink-200 pl-6">
      {events.map((e, i) => (
        <li key={`${e.toStatus}-${i}`} className="relative">
          <span aria-hidden="true" className={`absolute -left-[1.95rem] top-1 size-3.5 rounded-full border-2 border-bg ${i === events.length - 1 ? "bg-teal-600 ring-2 ring-teal-200" : "bg-navy-300"}`} />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={e.toStatus} />
            <time dateTime={new Date(e.createdAt).toISOString()} className="text-xs text-ink-600">{formatDateTime(e.createdAt)}</time>
            {e.by ? <span className="text-xs text-ink-600">· {e.by}</span> : null}
          </div>
          <p className="mt-1 text-sm text-ink-700">{e.publicNote ?? STATUS_LABELS[e.toStatus as ApplicationStatus] ?? e.toStatus}</p>
        </li>
      ))}
    </ol>
  );
}
