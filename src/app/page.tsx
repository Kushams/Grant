import Link from "next/link";
import { BadgeCheck, Building2, ClipboardCheck, FileSearch, Lock, ShieldAlert, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { featuredOpportunities } from "@/lib/services/opportunities";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { Hero } from "@/components/home/hero";
import { HeroSearch } from "@/components/home/hero-search";
import { SiteFooter } from "@/components/layout/site-footer";
import { Accordion } from "@/components/ui/accordion";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { FAQ } from "@/content/faq";
import { STEPS } from "@/content/steps";
import { NO_FEE_STATEMENT, DEMO_SITE } from "@/config/organization";
import { PROGRAMME_CATEGORIES } from "@/lib/constants";

export default async function Home() {
  const now = new Date();
  const [featured, openCount] = await Promise.all([
    featuredOpportunities(3),
    db.opportunity.count({ where: { status: "PUBLISHED", AND: [{ OR: [{ opensAt: null }, { opensAt: { lte: now } }] }, { OR: [{ deadline: null }, { deadline: { gte: now } }] }] } }),
  ]);
  return (
    <>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Hero />
        <HeroSearch openCount={openCount} />

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16" aria-labelledby="featured-h">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <SectionHeading id="featured-h" eyebrow="Featured" title={DEMO_SITE ? "Demonstration opportunities" : "Funding opportunities"} description={DEMO_SITE ? "Fictional examples that show how a programme page works." : "Programmes listed on the network, with their status and what is still to be confirmed."} />
              <Link href="/opportunities" className="font-semibold text-teal-700 underline">See all opportunities</Link>
            </div>
          </Reveal>
          {featured.length ? (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featured.map((o, i) => <Reveal as="li" key={o.id} delay={i * 80}><OpportunityCard o={o} /></Reveal>)}</ul>
          ) : <EmptyState title="No opportunities are open yet" description={DEMO_SITE ? "Run the seed script to load fictional demonstration data." : "Read about the General Opportunity Fund. Applications will be announced here when they open."} action={DEMO_SITE ? undefined : { href: "/fund", label: "About the General Opportunity Fund" }} />}
        </section>

        <section className="border-y border-ink-200 bg-white" aria-labelledby="audiences-h">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <Reveal><SectionHeading id="audiences-h" eyebrow="Who it’s for" title="Built for people and for organizations" className="mb-10" /></Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              <Reveal className="rounded-2xl border border-ink-200 bg-sand-50 p-7">
                <UserRound className="size-8 text-teal-700" aria-hidden="true" />
                <h3 className="mt-3 text-2xl font-medium">For individuals &amp; entrepreneurs</h3>
                <p className="mt-2 text-ink-700">Create a simple personal profile, save opportunities for later, and work through an application at your own pace with automatic draft saving.</p>
                <ul className="mt-4 space-y-1.5 text-sm text-ink-700"><li>• Individual and entrepreneur categories</li><li>• Clear eligibility explained up front</li><li>• Track every step from your dashboard</li></ul>
                <LinkButton href="/register" className="mt-5">Register as an individual</LinkButton>
              </Reveal>
              <Reveal delay={100} className="rounded-2xl border border-ink-200 bg-sand-50 p-7">
                <Building2 className="size-8 text-teal-700" aria-hidden="true" />
                <h3 className="mt-3 text-2xl font-medium">For businesses &amp; organizations</h3>
                <p className="mt-2 text-ink-700">Set up an organization profile for your business, nonprofit or community group and manage applications on its behalf, with awards and planned instalments visible in one place.</p>
                <ul className="mt-4 space-y-1.5 text-sm text-ink-700"><li>• Small, registered, nonprofit and community types</li><li>• Explicit organization membership — no guesswork</li><li>• Programme-specific questions and requirements</li></ul>
                <LinkButton href="/register" variant="accent" className="mt-5">Register an organization</LinkButton>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20" aria-labelledby="process-h">
          <Reveal><SectionHeading id="process-h" eyebrow="The process" title="How an application works" /></Reveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.slice(0, 5).map(([title], i) => (
              <Reveal as="li" key={title} delay={i * 70} className="rounded-xl border border-ink-200 bg-white p-4">
                <span className="text-2xl font-medium text-teal-700" aria-hidden="true">{i + 1}</span>
                <p className="mt-1 text-sm font-semibold text-ink-900"><span className="sr-only">Step {i + 1}: </span>{title}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-5"><Link href="/how-it-works" className="font-semibold text-teal-700 underline">See all ten steps</Link></p>
        </section>

        <section className="bg-navy-900 text-white" aria-labelledby="review-h">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <ClipboardCheck className="mb-4 size-9 text-teal-200" aria-hidden="true" />
              <SectionHeading id="review-h" tone="dark" eyebrow="Review" title="How applications are reviewed" description="Reviewing is a structured, recorded process — and recommendations are kept separate from final decisions." />
            </Reveal>
            <ol className="space-y-3">
              {[["Initial review", "Completeness and basic eligibility."], ["Detailed review", "A reviewer assesses the application and may ask questions."], ["Recommendation", "Recorded by the reviewer — not a decision."], ["Final decision", "Recorded separately by an administrator, with a reason."]].map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 80} className="liquid-glass liquid-glass-strong flex gap-4 rounded-xl p-4">
                  <span className="text-xl font-medium text-teal-200" aria-hidden="true">{i + 1}</span>
                  <div><p className="font-semibold"><span className="sr-only">Stage {i + 1}: </span>{t}</p><p className="text-sm text-white/80">{d}</p></div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20" aria-labelledby="safety-h">
          <div className="grid gap-8 lg:grid-cols-3">
            <Reveal>
              <ShieldAlert className="mb-4 size-9 text-warn-700" aria-hidden="true" />
              <SectionHeading id="safety-h" eyebrow="Stay safe" title="Transparency & fraud prevention" description={`Real programmes do not charge you to receive an award. ${NO_FEE_STATEMENT}`} />
              <Link href="/fraud-prevention" className="mt-3 inline-block font-semibold text-teal-700 underline">Read the full guidance</Link>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {([[BadgeCheck, DEMO_SITE ? "Clearly labelled demos" : "Clear status", DEMO_SITE ? "Fictional opportunities always carry a visible DEMO label." : "Every opportunity shows whether it is open, upcoming or closed, and what is still to be confirmed."], [Lock, "No sensitive data", "We never ask for ID numbers, bank details or card data."], [FileSearch, "Honest status", "Award and payment records are staff-entered and labelled as such."], [ShieldAlert, "No upfront payments", "Never pay to “release” or “unlock” funding. Report anyone who asks."]] as const).map(([Icon, t, d], i) => (
                <Reveal as="li" key={t} delay={i * 70} className="rounded-xl border border-ink-200 bg-white p-5">
                  <Icon className="size-6 text-teal-700" aria-hidden="true" /><p className="mt-2 font-semibold text-ink-900">{t}</p><p className="mt-1 text-sm text-ink-700">{d}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-ink-200 bg-white" aria-labelledby="cats-h">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <Reveal>
              <SectionHeading id="cats-h" eyebrow="Explore" title="Browse by category" />
              <ul className="mt-6 flex flex-wrap gap-3">{PROGRAMME_CATEGORIES.map((c) => <li key={c}><Link href={`/opportunities?category=${encodeURIComponent(c)}`} className="inline-flex min-h-11 items-center rounded-full border border-ink-300 bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-navy-50">{c}</Link></li>)}</ul>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20" aria-labelledby="faq-h">
          <Reveal>
            <SectionHeading id="faq-h" eyebrow="Help" title="Frequently asked questions" className="mb-6" />
            <Accordion items={FAQ.slice(0, 6).map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
            <p className="mt-4"><Link href="/faq" className="font-semibold text-teal-700 underline">View all questions</Link></p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-4" aria-labelledby="cta-h">
          <Reveal className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-navy-800 p-8 text-white">
            <div><h2 id="cta-h" className="text-2xl font-medium text-white">Questions? We’re here to help.</h2><p className="mt-1 text-teal-50">Use the support form — messages go to our support queue and replies appear on your dashboard.</p></div>
            <LinkButton href="/contact" variant="secondary" size="lg">Contact support</LinkButton>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
