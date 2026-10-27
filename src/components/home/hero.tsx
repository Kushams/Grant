import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { NO_GUARANTEE_STATEMENT, ORG, PRIMARY_NAV, PROTOTYPE_NOTICE } from "@/config/organization";
import { APPLICANT_TYPES, APPLICANT_TYPE_LABELS } from "@/lib/constants";
import { HeroNav } from "./hero-nav";
import { HeroVideo } from "./hero-video";

/** Full-height liquid-glass hero over a looping background video. */
export async function Hero({ openCount }: { openCount: number }) {
  const user = await getCurrentUser();
  const staff = !!user && can(user.role, "admin:access");
  return (
    <section aria-labelledby="hero-h" className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-navy-950 text-white">
      <HeroVideo />
      <div className="relative z-20 border-b border-white/10 bg-warn-50/95 text-warn-700">
        <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs font-semibold sm:text-sm">{PROTOTYPE_NOTICE} All opportunities shown are fictional demonstrations.</p>
      </div>
      <HeroNav links={PRIMARY_NAV} account={{ signedIn: !!user, homeHref: staff ? "/admin" : "/dashboard", homeLabel: staff ? "Staff area" : "My dashboard" }} />

      <div className="relative z-20 mt-auto grid gap-8 px-6 pb-10 pt-16 sm:px-12 sm:pb-16 lg:grid-cols-[minmax(0,42rem)_22rem] lg:items-end lg:justify-between">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-teal-200">{ORG.name}</p>
          <h1 id="hero-h" className="mb-4 text-4xl font-medium leading-tight tracking-tight !text-white sm:text-5xl lg:text-6xl">{ORG.tagline}</h1>
          <p className="mb-7 max-w-md text-sm leading-relaxed text-white/70">
            Explore empowerment programmes, discover funding opportunities, understand eligibility requirements, and track your applications through one organized platform.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/opportunities" className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90 sm:px-7 sm:text-base">Explore Opportunities</Link>
            <Link href="/how-it-works" className="liquid-glass rounded-full px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5 sm:px-7 sm:text-base">How It Works</Link>
          </div>
          <p className="mt-5 max-w-md text-xs text-white/60">{ORG.name} is an independent platform — not a government agency. {NO_GUARANTEE_STATEMENT}</p>
        </div>

        <form action="/opportunities" method="get" role="search" aria-label="Search opportunities" className="liquid-glass liquid-glass-strong space-y-4 rounded-2xl p-5">
          <h2 className="font-sans text-base font-semibold tracking-normal text-white">Search opportunities</h2>
          <div>
            <label htmlFor="home-q" className="text-sm font-medium text-white">Keyword</label>
            <input id="home-q" name="q" type="search" placeholder="e.g. training, farming" className="mt-1 block w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2.5 text-base text-white placeholder:text-white/60" />
          </div>
          <div>
            <label htmlFor="home-type" className="text-sm font-medium text-white">I am applying as</label>
            <select id="home-type" name="applicantType" defaultValue="" className="mt-1 block w-full rounded-lg border border-white/25 bg-navy-900/80 px-3 py-2.5 text-base text-white">
              <option value="">Any applicant type</option>
              {APPLICANT_TYPES.map((t) => <option key={t} value={t}>{APPLICANT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"><Search className="size-4" aria-hidden="true" /> Search</button>
          <p className="text-xs text-white/70">{openCount === 0 ? "No demonstration opportunities are open right now." : `${openCount} fictional demonstration ${openCount === 1 ? "opportunity is" : "opportunities are"} currently open.`}</p>
        </form>
      </div>
    </section>
  );
}
