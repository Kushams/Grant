import Link from "next/link";
import { FundCard } from "@/components/opportunities/fund-card";
import { SceneGlobe, SceneSkyline } from "@/components/graphics/scenes";
import { Spot, type SpotName } from "@/components/graphics/spots";
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
import { NO_FEE_STATEMENT, DEMO_SITE } from "@/config/organization";

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
          ) : DEMO_SITE ? <EmptyState title="No opportunities to show yet" description="Run the seed script to load fictional demonstration data." /> : <div className="grid items-center gap-8 lg:grid-cols-[22rem_1fr]"><ul><li><FundCard /></li></ul><SceneGlobe className="hidden h-auto w-full rounded-3xl shadow-[var(--shadow-card)] lg:block" /></div>}
        </section>

        <section className="border-y border-ink-200 bg-white" aria-labelledby="process-h">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <Reveal><SectionHeading id="process-h" eyebrow="How it works" title="Four simple steps" /></Reveal>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {([["Create an account", "Use a passkey or access code — no email needed.", "key"], ["Apply", "Tell us what you need, the amount you are requesting and a short budget.", "document"], ["Review", "The Board reviews your application against published criteria.", "search"], ["Decision", "You are told the outcome and what happens next.", "check"]] as Array<[string, string, SpotName]>).map(([title, d, icon], i) => (
                <Reveal as="li" key={title} delay={i * 70} className="rounded-xl border border-ink-200 bg-sand-50 p-5">
                  <div className="flex items-center justify-between"><Spot name={icon} className="size-14" /><span className="text-3xl font-semibold text-navy-200" aria-hidden="true">{i + 1}</span></div>
                  <p className="mt-3 font-semibold text-ink-900"><span className="sr-only">Step {i + 1}: </span>{title}</p>
                  <p className="mt-1 text-sm text-ink-700">{d}</p>
                </Reveal>
              ))}
            </ol>
            <p className="mt-6"><Link href="/fund#how-it-works" className="font-semibold text-teal-700 underline">Read the full process</Link></p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20" aria-labelledby="safety-h">
          <div className="grid gap-8 lg:grid-cols-3">
            <Reveal>
              <Spot name="shield" className="mb-4 size-16" tone="blue" />
              <SectionHeading id="safety-h" eyebrow="Stay safe" title="Applying is free" description={`${NO_FEE_STATEMENT}`} />
              <Link href="/faq#safety" className="mt-3 inline-block font-semibold text-teal-700 underline">How to spot a fake offer</Link>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {(([["calendar", "Clear status", "Every opportunity shows whether it is open, upcoming or closed."], ["lock", "No sensitive data", "We never ask for ID numbers, bank details or card data."], ["document", "Honest records", "Award and payment records are entered by staff and labelled as such."], ["shield", "No upfront payments", "Never pay an outside agent to “guarantee” a grant."]] as Array<[string, string, string]>)).map(([Icon, t, d], i) => (
                <Reveal as="li" key={t} delay={i * 70} className="rounded-xl border border-ink-200 bg-white p-5">
                  <Spot name={Icon as SpotName} className="size-11" /><p className="mt-3 font-semibold text-ink-900">{t}</p><p className="mt-1 text-sm text-ink-700">{d}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20" aria-labelledby="faq-h">
          <Reveal>
            <div className="mb-6 flex items-center gap-4"><Spot name="question" className="hidden size-14 sm:block" tone="blue" /><SectionHeading id="faq-h" eyebrow="Help" title="Frequently asked questions" /></div>
            <Accordion items={FAQ.slice(0, 4).map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
            <p className="mt-4"><Link href="/faq" className="font-semibold text-teal-700 underline">More questions and staying safe</Link></p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-4" aria-labelledby="cta-h">
          <Reveal className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-navy-800 p-8 text-white">
            <div><h2 id="cta-h" className="text-2xl font-medium text-white">Questions? We’re here to help.</h2><p className="mt-1 text-teal-50">Use the support form — messages go to our support queue and replies appear on your dashboard.</p></div>
            <LinkButton href="/contact" variant="secondary" size="lg">Contact support</LinkButton>
          </Reveal>
        </section>
        <SceneSkyline className="mt-20 block h-40 w-full sm:h-52" />
      </main>
      <SiteFooter />
    </>
  );
}
