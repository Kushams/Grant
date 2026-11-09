import Link from "next/link";
import Image from "next/image";
import { CalendarClock, FileText, Lock, ShieldCheck } from "lucide-react";
import { FundCard } from "@/components/opportunities/fund-card";
import { PhotoFigure } from "@/components/graphics/photos";
import homeFundScene from "@/assets/photos/home-fund-scene.jpg";
import homeSkylineBand from "@/assets/photos/home-skyline-band.jpg";
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
import { FAQ, FAQ_LIVE } from "@/content/faq";
import { NO_FEE_STATEMENT, DEMO_SITE } from "@/config/organization";

const SAFETY_CARDS = [
  { icon: CalendarClock, title: "Clear status", text: "Everything about the Fund is on one page, with what is still to be confirmed.", demo: "Every opportunity shows whether it is open, upcoming or closed." },
  { icon: Lock, title: "No sensitive data", text: "We never ask for ID numbers, bank details or card data." },
  { icon: FileText, title: "Honest records", text: "Award and payment records are entered by staff and labelled as such." },
  { icon: ShieldCheck, title: "No upfront payments", text: "Never pay an outside agent to “guarantee” a grant." },
];

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
        {DEMO_SITE ? <HeroSearch openCount={openCount} /> : null}

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16" aria-labelledby="featured-h">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <SectionHeading id="featured-h" eyebrow="Featured" title={DEMO_SITE ? "Demonstration opportunities" : "General Opportunity Fund"} description={DEMO_SITE ? "Fictional examples that show how a programme page works." : "A broad pathway to funding for people, ideas and initiatives. Applications are open — read the details and apply on the fund page."} />
              {DEMO_SITE ? <Link href="/opportunities" className="font-semibold text-teal-700 underline">See all opportunities</Link> : null}
            </div>
          </Reveal>
          {featured.length ? (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featured.map((o, i) => <Reveal as="li" key={o.id} delay={i * 80}><OpportunityCard o={o} /></Reveal>)}</ul>
          ) : DEMO_SITE ? <EmptyState title="No opportunities to show yet" description="Run the seed script to load fictional demonstration data." /> : <div className="grid items-center gap-8 lg:grid-cols-[22rem_1fr]"><ul><li><FundCard /></li></ul><PhotoFigure src={homeFundScene} alt="People collaborating around a table with laptops and charts" className="hidden aspect-[16/10] shadow-[var(--shadow-card)] lg:block" /></div>}
        </section>

        <section className="border-y border-ink-200 bg-white" aria-labelledby="process-h">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <Reveal><SectionHeading id="process-h" eyebrow="How it works" title="Four simple steps" /></Reveal>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {((DEMO_SITE ? [["Create an account", "Use a passkey or access code — no email needed."], ["Apply", "Tell us what you need, the amount you are requesting and a short budget."], ["Review", "The Board reviews your application against published criteria."], ["Decision", "You are told the outcome and what happens next."]] : [["Learn about the Fund", "See who can apply and what it may support."], ["Fill in the form", "Tell us what you need, the amount you are requesting and a short budget."], ["Review", "The Board reviews your application against published criteria."], ["Decision", "You are told the outcome and what happens next."]]) as Array<[string, string]>).map(([title, d], i) => (
                <Reveal as="li" key={title} delay={i * 70} className="rounded-xl border border-ink-200 bg-sand-50 p-5">
                  <span className="flex size-11 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-white" aria-hidden="true">{i + 1}</span>
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
              <SectionHeading id="safety-h" eyebrow="Stay safe" title="Applying is free" description={`${NO_FEE_STATEMENT}`} />
              <Link href="/faq#safety" className="mt-3 inline-block font-semibold text-teal-700 underline">How to spot a fake offer</Link>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {SAFETY_CARDS.map((card, i) => (
                <Reveal as="li" key={card.title} delay={i * 70} className="rounded-xl border border-ink-200 bg-white p-5">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-navy-800 text-white"><card.icon className="size-5" aria-hidden="true" /></span><p className="mt-3 font-semibold text-ink-900">{card.title}</p><p className="mt-1 text-sm text-ink-700">{card.demo && DEMO_SITE ? card.demo : card.text}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20" aria-labelledby="faq-h">
          <Reveal>
            <div className="mb-6"><SectionHeading id="faq-h" eyebrow="Help" title="Frequently asked questions" /></div>
            <Accordion items={(DEMO_SITE ? FAQ : FAQ_LIVE).slice(0, 4).map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
            <p className="mt-4"><Link href="/faq" className="font-semibold text-teal-700 underline">More questions and staying safe</Link></p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-4" aria-labelledby="cta-h">
          <Reveal className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-navy-800 p-8 text-white">
            <div><h2 id="cta-h" className="text-2xl font-medium text-white">Questions? We’re here to help.</h2><p className="mt-1 text-teal-50">Use the support form — messages go to our support queue and replies appear on your dashboard.</p></div>
            <LinkButton href="/contact" variant="secondary" size="lg">Contact support</LinkButton>
          </Reveal>
        </section>
        <div className="relative mt-20 block h-40 w-full overflow-hidden sm:h-52" aria-hidden="true">
          <Image src={homeSkylineBand} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-navy-900/25" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
