import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { STEPS } from "@/content/steps";
import { NO_FEE_STATEMENT, NO_GUARANTEE_STATEMENT } from "@/config/organization";

export const metadata: Metadata = { title: "How it works" };


export default function HowItWorks() {
  return (
    <ContentPage wide eyebrow="The applicant journey" title="How it works" intro="From discovering an opportunity to understanding a decision — what to expect at each step.">
      <Alert tone="warn" title="Applying does not guarantee approval or payment" className="mb-8 max-w-3xl">
        {NO_GUARANTEE_STATEMENT} {NO_FEE_STATEMENT}
      </Alert>
      <ol className="grid gap-4 md:grid-cols-2">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="flex gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-800 font-display text-lg font-semibold text-white">{i + 1}</span>
            <div><h2 className="font-sans text-base font-bold tracking-normal text-ink-900"><span className="sr-only">Step {i + 1}: </span>{title}</h2><p className="mt-1 text-sm text-ink-700">{text}</p></div>
          </li>
        ))}
      </ol>
      <section className="mt-12 max-w-3xl" aria-labelledby="review-h">
        <h2 id="review-h" className="text-2xl font-semibold">How applications are reviewed</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-700">
          <li><strong>Initial review</strong> — completeness and basic eligibility.</li>
          <li><strong>Detailed review</strong> — a reviewer assesses the application against the programme criteria and may ask for more information.</li>
          <li><strong>Recommendation</strong> — the reviewer records a recommendation. This is not a decision.</li>
          <li><strong>Final decision</strong> — an administrator approves or declines, with a recorded reason.</li>
        </ol>
        <p className="mt-3 text-sm text-ink-600">Internal reviewer notes are confidential and are not shown to applicants.</p>
      </section>
      <div className="mt-10 flex gap-3"><LinkButton href="/opportunities" size="lg">Explore opportunities</LinkButton><LinkButton href="/eligibility" variant="outline" size="lg">Eligibility guide</LinkButton></div>
    </ContentPage>
  );
}
