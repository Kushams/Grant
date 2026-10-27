import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { Alert } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Eligibility guide" };

const CATEGORIES: Array<[string, string, string]> = [
  ["Individuals", "People applying in their own name.", "May be asked about location and the purpose of their request."],
  ["Entrepreneurs", "Individuals building or launching a venture who may not yet have a registered business.", "May be asked to describe the venture and its stage."],
  ["Small businesses", "Small enterprises, registered or not, depending on the programme.", "Programmes may set size, sector or location conditions."],
  ["Registered businesses", "Businesses that are formally registered where they operate.", "Registration requirements are set per programme — none are assumed here."],
  ["Nonprofit organizations", "Not-for-profit organizations, including NGOs.", "Programmes may set mission, location or governance conditions."],
  ["Community organizations", "Local groups, cooperatives and associations.", "Programmes may accept informal groups or require formal status."],
  ["Other eligible entities", "Any other entity type an administrator configures for a specific programme.", "Defined entirely by that programme’s terms."],
];

export default function Eligibility() {
  return (
    <ContentPage wide eyebrow="Eligibility" title="Eligibility guide" intro="Eligibility differs from one programme to the next. This guide explains the categories you will see — the opportunity page is always the authority.">
      <Alert tone="info" className="mb-8 max-w-3xl" title="Not every category qualifies for every opportunity">
        Each opportunity lists the applicant types, regions and criteria it accepts. These categories are configurable by administrators, so the list below is a general guide, not a promise of eligibility.
      </Alert>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(([name, who, note]) => (
          <li key={name} className="rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-sans text-base font-bold tracking-normal text-navy-900">{name}</h2>
            <p className="mt-1 text-sm text-ink-800">{who}</p>
            <p className="mt-2 text-sm text-ink-600">{note}</p>
          </li>
        ))}
      </ul>
      <section className="mt-10 max-w-3xl" aria-labelledby="checks-h">
        <h2 id="checks-h" className="text-2xl font-semibold">What programmes typically check</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-700">
          <li>Whether your applicant type is accepted.</li>
          <li>Whether your country or region is eligible.</li>
          <li>Whether the application window is open (opening date and deadline).</li>
          <li>Whether you have already applied, where a programme allows only one application each.</li>
          <li>Programme-specific questions and any required information.</li>
        </ul>
        <p className="mt-3 text-sm text-ink-600">If an item is not yet confirmed for an opportunity you will see “Details to be confirmed” — we never fill gaps with guesses. We do not require identity documents, bank statements or payment details.</p>
      </section>
      <div className="mt-8"><LinkButton href="/opportunities">Browse opportunities by applicant type</LinkButton></div>
    </ContentPage>
  );
}
