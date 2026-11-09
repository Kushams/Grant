import Link from "next/link";
import { CalendarClock, Coins, MapPin, Users } from "lucide-react";
import type { OpportunityView } from "@/lib/services/opportunities";
import { Badge, DemoBadge, OpportunityStateBadge } from "@/components/ui/badge";
import { applicantTypeLabel, deadlineText, fundingLabel } from "@/lib/opportunity-display";

export function OpportunityCard({ o }: { o: OpportunityView }) {
  const funding = fundingLabel(o);
  return (
    <article className="relative flex h-full flex-col rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {o.isDemo ? <DemoBadge /> : <Badge tone="ok">Verified programme</Badge>}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">{o.category}</p>
      <h3 className="mt-1 text-xl font-semibold">
        <Link href={`/opportunities/${o.slug}`} className="after:absolute after:inset-0 hover:underline">{o.title}</Link>
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-ink-700">{o.shortDescription}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-ink-700">
        <li className="flex gap-2"><Coins className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden="true" /><span><span className="sr-only">Funding: </span>{funding ?? <span className="italic">Funding amount to be confirmed</span>}</span></li>
        <li className="flex gap-2"><CalendarClock className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden="true" /><span><span className="sr-only">Deadline: </span>{deadlineText(o.deadline)}</span></li>
        <li className="flex gap-2"><Users className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden="true" /><span><span className="sr-only">Open to: </span>{o.applicantTypeList.length ? o.applicantTypeList.map(applicantTypeLabel).join(", ") : <span className="italic">Applicant types to be confirmed</span>}</span></li>
        <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden="true" /><span><span className="sr-only">Eligible regions: </span>{o.regionList.length ? o.regionList.join(", ") : <span className="italic">Regions to be confirmed</span>}</span></li>
      </ul>
      <div className="mt-auto flex items-center justify-between pt-4">
        <OpportunityStateBadge state={o.window.state} />
        <span className="text-xs font-semibold text-ink-600">{o.reference}</span>
      </div>
    </article>
  );
}
