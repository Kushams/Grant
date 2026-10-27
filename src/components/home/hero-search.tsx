import { Search } from "lucide-react";
import { APPLICANT_TYPES, APPLICANT_TYPE_LABELS } from "@/lib/constants";

/** Floating search bar that overlaps the bottom of the hero. A plain GET form, so it works without JavaScript. */
export function HeroSearch({ openCount }: { openCount: number }) {
  return (
    <section aria-label="Search opportunities" className="relative z-20 -mt-16 px-4">
      <form action="/opportunities" method="get" role="search" className="mx-auto grid max-w-5xl gap-3 rounded-3xl border border-white/10 bg-[#12141b]/90 p-4 shadow-2xl backdrop-blur-xl sm:grid-cols-[1.4fr_1fr_auto] sm:items-end sm:p-5">
        <div>
          <label htmlFor="home-q" className="mb-1.5 block text-sm font-medium text-white">Search opportunities</label>
          <input id="home-q" name="q" type="search" placeholder="e.g. training, farming, community" className="block w-full rounded-full border border-white/15 bg-[#181a22] px-4 py-2.5 text-base text-white placeholder:text-ink-500" />
        </div>
        <div>
          <label htmlFor="home-type" className="mb-1.5 block text-sm font-medium text-white">I am applying as</label>
          <select id="home-type" name="applicantType" defaultValue="" className="block w-full rounded-full border border-white/15 bg-[#181a22] px-4 py-2.5 text-base text-white">
            <option value="">Any applicant type</option>
            {APPLICANT_TYPES.map((t) => <option key={t} value={t}>{APPLICANT_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-[#08090d] hover:bg-white/90"><Search className="size-4" aria-hidden="true" /> Search</button>
        <p className="text-xs text-ink-600 sm:col-span-3">{openCount === 0 ? "No demonstration opportunities are open right now." : `${openCount} fictional demonstration ${openCount === 1 ? "opportunity is" : "opportunities are"} currently open.`}</p>
      </form>
    </section>
  );
}
