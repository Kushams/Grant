import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, ClipboardCheck, FileSearch, Lock, Search, ShieldAlert, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { featuredOpportunities } from "@/lib/services/opportunities";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { LinkButton, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { FAQ } from "@/content/faq";
import { NO_FEE_STATEMENT, NO_GUARANTEE_STATEMENT, ORG } from "@/config/organization";
import { STEPS } from "@/app/how-it-works/page";
import { APPLICANT_TYPES, APPLICANT_TYPE_LABELS, PROGRAMME_CATEGORIES } from "@/lib/constants";

export default async function Home() {
  const [featured, openCount] = await Promise.all([
    featuredOpportunities(3),
    db.opportunity.count({
      where: { status: "PUBLISHED", AND: [{ OR: [{ opensAt: null }, { opensAt: { lte: new Date() } }] }, { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] }] },
    }),
  ]);
  return (
    <>
      {/* 1-4 Hero */}
      <section className="border-b border-ink-200 bg-gradient-to-b from-navy-50 to-sand-50" aria-labelledby="hero-h">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-700">{ORG.name}</p>
            <h1 id="hero-h" className="text-4xl font-semibold sm:text-5xl lg:text-6xl">{ORG.tagline}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-700">
              Explore empowerment programmes, discover funding opportunities, understand eligibility requirements, and track your applications through one organized platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/opportunities" size="lg">Explore Opportunities <ArrowRight className="size-4" aria-hidden="true" /></LinkButton>
              <LinkButton href="/how-it-works" size="lg" variant="outline">How It Works</LinkButton>
            </div>
            <p className="mt-5 max-w-xl text-sm text-ink-600">
              {ORG.name} is an independent platform — not a government agency. This is a prototype: every opportunity shown is a fictional demonstration. {NO_GUARANTEE_STATEMENT}
            </p>
          </div>
          {/* 5 Search */}
          <div className="self-center rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-sans text-lg font-bold tracking-normal text-navy-900">Search opportunities</h2>
            <form action="/opportunities" method="get" className="mt-4 space-y-4" role="search" aria-label="Search opportunities">
              <div>
                <label htmlFor="home-q" className="text-sm font-semibold text-ink-900">Keyword</label>
                <input id="home-q" name="q" type="search" placeholder="e.g. training, farming, community" className="mt-1 block w-full rounded-lg border border-ink-300 px-3 py-2.5 text-base" />
              </div>
              <div>
                <label htmlFor="home-type" className="text-sm font-semibold text-ink-900">I am applying as</label>
                <select id="home-type" name="applicantType" className="mt-1 block w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-base" defaultValue="">
                  <option value="">Any applicant type</option>
                  {APPLICANT_TYPES.map((t) => <option key={t} value={t}>{APPLICANT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <Button type="submit" className="w-full" size="lg"><Search className="size-4" aria-hidden="true" /> Search</Button>
            </form>
            <p className="mt-4 text-sm text-ink-600">
              {openCount === 0 ? "No demonstration opportunities are open right now." : `${openCount} demonstration ${openCount === 1 ? "opportunity is" : "opportunities are"} currently listed as open (fictional).`}
            </p>
          </div>
        </div>
      </section>

      {/* 6 Featured demo opportunities */}
      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="featured-h">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div><h2 id="featured-h" className="text-3xl font-semibold">Featured demonstration opportunities</h2><p className="mt-1 text-ink-600">Fictional examples that show how a programme page works.</p></div>
          <Link href="/opportunities" className="font-semibold text-navy-800 underline">See all opportunities</Link>
        </div>
        {featured.length ? <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featured.map((o) => <li key={o.id}><OpportunityCard o={o} /></li>)}</ul>
          : <EmptyState title="No opportunities to show yet" description="Run the seed script to load fictional demonstration data." />}
      </section>

      {/* 7-8 Individuals & organizations */}
      <section className="border-y border-ink-200 bg-white" aria-labelledby="audiences-h">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 id="audiences-h" className="mb-8 text-3xl font-semibold">Built for people and for organizations</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-ink-200 bg-sand-50 p-7">
              <UserRound className="size-8 text-teal-700" aria-hidden="true" />
              <h3 className="mt-3 text-2xl font-semibold">For individuals &amp; entrepreneurs</h3>
              <p className="mt-2 text-ink-700">Create a simple personal profile, save opportunities for later, and work through an application at your own pace with automatic draft saving.</p>
              <ul className="mt-4 space-y-1.5 text-sm text-ink-700"><li>• Individual and entrepreneur categories</li><li>• Clear eligibility explained up front</li><li>• Track every step from your dashboard</li></ul>
              <LinkButton href="/register" className="mt-5">Register as an individual</LinkButton>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-sand-50 p-7">
              <Building2 className="size-8 text-teal-700" aria-hidden="true" />
              <h3 className="mt-3 text-2xl font-semibold">For businesses &amp; organizations</h3>
              <p className="mt-2 text-ink-700">Set up an organization profile for your business, nonprofit or community group and manage applications on its behalf, with awards and planned instalments visible in one place.</p>
              <ul className="mt-4 space-y-1.5 text-sm text-ink-700"><li>• Small, registered, nonprofit and community types</li><li>• Explicit organization membership — no guesswork</li><li>• Programme-specific questions and requirements</li></ul>
              <LinkButton href="/register" variant="accent" className="mt-5">Register an organization</LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Process */}
      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="process-h">
        <h2 id="process-h" className="text-3xl font-semibold">The application process</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.slice(0, 5).map(([title], i) => (
            <li key={title} className="rounded-xl border border-ink-200 bg-white p-4"><span className="font-display text-2xl font-semibold text-teal-700" aria-hidden="true">{i + 1}</span><p className="mt-1 text-sm font-semibold text-ink-900"><span className="sr-only">Step {i + 1}: </span>{title}</p></li>
          ))}
        </ol>
        <p className="mt-5"><Link href="/how-it-works" className="font-semibold text-navy-800 underline">See all ten steps</Link></p>
      </section>

      {/* 10 Review */}
      <section className="bg-navy-900 text-white" aria-labelledby="review-h">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[1fr_1.2fr]">
          <div><ClipboardCheck className="size-9 text-teal-200" aria-hidden="true" /><h2 id="review-h" className="mt-3 text-3xl font-semibold text-white">How applications are reviewed</h2><p className="mt-3 text-navy-100">Reviewing is a structured, recorded process — and recommendations are kept separate from final decisions.</p></div>
          <ol className="space-y-3">
            {[["Initial review", "Completeness and basic eligibility."], ["Detailed review", "A reviewer assesses the application and may ask questions."], ["Recommendation", "Recorded by the reviewer — not a decision."], ["Final decision", "Recorded separately by an administrator, with a reason."]].map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-lg bg-white/10 p-4"><span className="font-display text-xl font-semibold text-teal-200" aria-hidden="true">{i + 1}</span><div><p className="font-semibold"><span className="sr-only">Stage {i + 1}: </span>{t}</p><p className="text-sm text-navy-100">{d}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      {/* 11 Fraud prevention & transparency */}
      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="safety-h">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1"><ShieldAlert className="size-9 text-warn-700" aria-hidden="true" /><h2 id="safety-h" className="mt-3 text-3xl font-semibold">Transparency &amp; fraud prevention</h2><p className="mt-3 text-ink-700">Real programmes do not charge you to receive an award. {NO_FEE_STATEMENT}</p><Link href="/fraud-prevention" className="mt-3 inline-block font-semibold text-navy-800 underline">Read the full guidance</Link></div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[[BadgeCheck, "Clearly labelled demos", "Fictional opportunities always carry a visible DEMO label."], [Lock, "No sensitive data", "We never ask for ID numbers, bank details or card data."], [FileSearch, "Honest status", "Award and payment records are staff-entered and labelled as such."], [ShieldAlert, "No upfront payments", "Never pay to “release” or “unlock” funding. Report anyone who asks."]].map(([Icon, t, d]) => {
              const I = Icon as typeof BadgeCheck;
              return <li key={t as string} className="rounded-xl border border-ink-200 bg-white p-5"><I className="size-6 text-teal-700" aria-hidden="true" /><p className="mt-2 font-semibold text-ink-900">{t as string}</p><p className="mt-1 text-sm text-ink-700">{d as string}</p></li>;
            })}
          </ul>
        </div>
      </section>

      {/* categories */}
      <section className="border-y border-ink-200 bg-white" aria-labelledby="cats-h">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 id="cats-h" className="text-2xl font-semibold">Browse by category</h2>
          <ul className="mt-5 flex flex-wrap gap-3">{PROGRAMME_CATEGORIES.map((c) => <li key={c}><Link href={`/opportunities?category=${encodeURIComponent(c)}`} className="inline-flex rounded-full border border-ink-300 bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-navy-50">{c}</Link></li>)}</ul>
        </div>
      </section>

      {/* 12 FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-16" aria-labelledby="faq-h">
        <h2 id="faq-h" className="text-3xl font-semibold">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-ink-200 rounded-xl border border-ink-200 bg-white">
          {FAQ.slice(0, 6).map((f) => <details key={f.q} className="p-5"><summary className="cursor-pointer font-semibold text-ink-900">{f.q}</summary><p className="mt-3 text-ink-700">{f.a}</p></details>)}
        </div>
        <p className="mt-4"><Link href="/faq" className="font-semibold text-navy-800 underline">View all questions</Link></p>
      </section>

      {/* 13 Contact CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-4" aria-labelledby="cta-h">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-teal-700 p-8 text-white">
          <div><h2 id="cta-h" className="text-2xl font-semibold text-white">Questions? We’re here to help.</h2><p className="mt-1 text-teal-50">Use the support form — messages go to our in-app support queue (no email is sent in this prototype).</p></div>
          <LinkButton href="/contact" variant="secondary" size="lg">Contact support</LinkButton>
        </div>
      </section>
    </>
  );
}
