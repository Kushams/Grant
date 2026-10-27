import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { NO_FEE_STATEMENT, NO_GUARANTEE_STATEMENT } from "@/config/organization";

export const metadata: Metadata = { title: "How it works" };

export const STEPS = [
  ["Discover an opportunity", "Search the directory and filter by who can apply, category, region, deadline and funding."],
  ["Read the eligibility criteria", "Every opportunity lists who can apply, where, what you need to provide and how decisions are made."],
  ["Create an account", "Register as an individual or as an organization or business. It takes a minute and does not commit you to anything."],
  ["Complete the appropriate profile", "Add the basics about you or your organization. We never ask for ID numbers, bank details or card data."],
  ["Prepare and submit the application", "Work through a guided, multi-step form. Progress is saved as a draft so you can leave and return."],
  ["Receive a reference number", "On submission you receive a unique reference such as NEN-DEMO-2026-ABC234 and an in-app confirmation."],
  ["Track the review process", "Follow your status and a timeline of every change from your dashboard."],
  ["Respond to any requests for further information", "Reviewers may ask a question or request a revision. You reply or edit from your application page."],
  ["Receive a decision", "A final decision is recorded by an administrator, separately from the reviewer’s recommendation."],
  ["If approved, review the confirmed award terms", "Staff may record an award and a planned disbursement schedule, which you can view on your application page."],
] as const;

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
