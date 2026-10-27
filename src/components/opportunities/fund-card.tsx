import Link from "next/link";
import { CalendarClock, Coins, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Programme card for the General Opportunity Fund, shown where no published opportunity record exists yet. */
export function FundCard() {
  return (
    <article className="relative flex h-full flex-col rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2"><Badge tone="navy">Programme</Badge></div>
      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">General</p>
      <h3 className="mt-1 text-xl font-semibold">
        <Link href="/fund" className="after:absolute after:inset-0 hover:underline">General Opportunity Fund</Link>
      </h3>
      <p className="mt-2 text-sm text-ink-700">A broad pathway for eligible individuals, entrepreneurs, creatives, community groups and organizations whose goals may not fit a specialized funding category.</p>
      <ul className="mt-4 space-y-1.5 text-sm text-ink-700">
        <li className="flex gap-2"><Coins className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden="true" /><span><span className="sr-only">Funding: </span>Tiered — see programme page</span></li>
        <li className="flex gap-2"><CalendarClock className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden="true" /><span><span className="sr-only">Dates: </span>To be announced</span></li>
        <li className="flex gap-2"><Users className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden="true" /><span><span className="sr-only">Open to: </span>Individuals, entrepreneurs, creatives, community groups, organizations</span></li>
        <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden="true" /><span><span className="sr-only">Regions: </span>United States and eligible international locations</span></li>
      </ul>
      <div className="mt-auto flex items-center justify-between pt-4">
        <Badge tone="info">Details announced soon</Badge>
        <span className="text-xs font-semibold text-ink-600">Read more</span>
      </div>
    </article>
  );
}
