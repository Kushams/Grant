import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { ContentPage } from "@/components/content/prose";
import { NetworkBanner } from "@/components/graphics/network-banner";
import { Spot } from "@/components/graphics/spots";
import { StepsGraphic } from "@/components/graphics/steps-graphic";
import { NO_GUARANTEE_STATEMENT, ORG } from "@/config/organization";
import { GENERAL_FUND_RANGE, fundOpensLabel } from "@/config/general-fund";

export const metadata: Metadata = {
  title: "General Opportunity Fund",
  description: "About the National Empowerment Network General Opportunity Fund: who may apply, what it may support, how applications will be evaluated and current application status.",
};

const RANGE_TEXT = `$${Number(GENERAL_FUND_RANGE.min).toLocaleString("en-US")} to $${Number(GENERAL_FUND_RANGE.max).toLocaleString("en-US")}`;

const SUPPORTS = [
  ["growth", "Personal and professional development", "Skills training, certifications, career development and initiatives that improve access to opportunity."],
  ["business", "Entrepreneurship and economic empowerment", "Qualifying business development, early-stage ventures, tools, equipment and resources for an approved project."],
  ["arts", "Creative projects and innovation", "Artistic initiatives, new concepts, research and practical solutions to identified challenges."],
  ["education", "Education and learning", "Learning resources, training initiatives and programmes that expand access to knowledge and skills."],
  ["home", "Community initiatives", "Projects that strengthen communities or deliver demonstrable public benefit."],
  ["star", "Other qualifying opportunities", "Anything that meets the Fund’s published objectives and eligibility criteria."],
] as const;

const CRITERIA = [
  ["Purpose and relevance", "How well the proposal fits the Fund’s objectives."],
  ["Need and opportunity", "The circumstances and barriers the proposal addresses."],
  ["Potential impact", "The expected benefits and who will benefit."],
  ["Feasibility", "Whether the plan, timeline and proposed outcomes are realistic."],
  ["Budget", "Whether the requested amount is reasonable and properly explained."],
  ["Accountability", "The applicant’s ability to manage funds and meet reporting requirements."],
] as const;

export default function FundPage() {
  return (
    <ContentPage wide icon={<Spot name="hand" className="size-16" />} eyebrow="Programme" title="General Opportunity Fund" intro="Expanding access to funding for people, ideas and initiatives with the potential to create meaningful personal, professional, economic and community impact.">
      <NetworkBanner className="mb-10 h-36 w-full rounded-2xl sm:h-44" />
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="prose-nen max-w-none space-y-2">
          <h2 className="flex items-center gap-3"><Spot name="globe" className="size-10" tone="blue" />About the Fund</h2>
          <p>The {ORG.name} General Opportunity Fund provides a broad pathway for eligible applicants whose goals and projects may not fit within a specialized funding category — from individuals pursuing new opportunities to entrepreneurs, creatives and organizations delivering community initiatives.</p>
          <p>The approach is built around accessibility, fairness, responsible funding, transparent evaluation and measurable impact.</p>

          <h2 id="who-can-apply" className="flex items-center gap-3"><Spot name="people" className="size-10" tone="blue" />Who can apply</h2>
          <p>Subject to the final eligibility rules, applications may be considered from:</p>
          <ul>
            <li>Individuals pursuing meaningful personal or professional opportunities.</li>
            <li>Aspiring entrepreneurs and eligible small businesses.</li>
            <li>Artists, creatives, independent professionals and innovators.</li>
            <li>Students and people seeking skills development or career advancement.</li>
            <li>Community groups and grassroots initiatives.</li>
            <li>Eligible nonprofit organizations, educational institutions and other qualifying organizations.</li>
            <li>Applicants anywhere in the world, <strong>except applicants located in Africa</strong>.</li>
          </ul>
          <p>Applicants must satisfy the requirements of the programme, applicable laws and any programme-specific restrictions. Not every applicant or proposed activity will necessarily qualify.</p>

          <h2 id="how-it-works" className="flex items-center gap-3"><Spot name="route" className="size-10" tone="blue" />How it works</h2>
          <StepsGraphic className="my-4 hidden w-full max-w-3xl sm:block" />
          <ol>
            <li><strong>Fill in the short application form.</strong> Who you are, what the funding is for, the amount you are requesting and a brief budget. No account is needed.</li>
            <li><strong>Review.</strong> Your application is checked for completeness and eligibility and assessed against the published criteria.</li>
            <li><strong>Decision.</strong> The Board of Directors decides and records the reason. We use the contact details you give to tell you the outcome.</li>
            <li><strong>If approved,</strong> you receive written award terms and instructions for the next steps. Any identity verification happens after approval, through a secure process.</li>
          </ol>

          <h2 className="flex items-center gap-3"><Spot name="spark" className="size-10" tone="blue" />What the Fund may support</h2>
          <div className="not-prose grid gap-3 sm:grid-cols-2">
            {SUPPORTS.map(([icon, t, d]) => (
              <div key={t} className="flex gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]">
                <Spot name={icon} className="size-12" />
                <div><p className="font-semibold text-ink-900">{t}</p><p className="mt-0.5 text-sm text-ink-700">{d}</p></div>
              </div>
            ))}
          </div>

          <h2 className="flex items-center gap-3"><Spot name="slider" className="size-10" tone="blue" />Requesting an amount</h2>
          <p>You tell us how much you need, between {RANGE_TEXT}. Your application explains the purpose of the request, how the money would be used (a short budget) and why the amount is appropriate. The Board may approve the full amount, a different amount, or decline. Requests are never guaranteed.</p>

          <h2 className="flex items-center gap-3"><Spot name="search" className="size-10" tone="blue" />How applications will be evaluated</h2>
          <p>A consistent review process considers:</p>
          <ul>{CRITERIA.map(([t, d]) => <li key={t}><strong>{t}:</strong> {d}</li>)}</ul>
          <p>Additional verification or documentation may be required depending on the size, nature and location of the proposed award.</p>

          <h2 className="flex items-center gap-3"><Spot name="scales" className="size-10" tone="blue" />Fairness, transparency and accountability</h2>
          <p>Applications are assessed under published criteria and consistent procedures. Decisions are subject to eligibility checks, conflict-of-interest safeguards, available programme funds, applicable law and formal authorization by the Board of Directors or its authorized delegates. Successful applicants may be required to sign a grant agreement, use funds only for approved purposes and report on expenditure and outcomes.</p>

          <h2 className="flex items-center gap-3"><Spot name="shield" className="size-10" tone="blue" />Staying safe</h2>
          <p>Applying is free. {ORG.name} will never ask you to pay a fee to apply or to receive an award, and never needs your Social Security number, ID, bank or card details to consider an application. Approved awards are paid by cheque. Read our <Link href="/faq#safety">fraud prevention guidance</Link>.</p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Alert tone="info" title="Application status">
            <strong>Applications open on {fundOpensLabel()}.</strong> The application form will be on this page. Nothing is collected before then.
          </Alert>
          <dl className="space-y-3 rounded-xl border border-ink-200 bg-white p-4 text-sm shadow-[var(--shadow-card)]">
            <div><dt className="font-semibold text-ink-900">Opening date</dt><dd className="text-ink-700">{fundOpensLabel()}</dd></div>
            <div><dt className="font-semibold text-ink-900">Amount you can request</dt><dd className="text-ink-700">{RANGE_TEXT}</dd></div>
            <div><dt className="font-semibold text-ink-900">Where to apply</dt><dd className="text-ink-700">Application form on this page</dd></div>
            <div><dt className="font-semibold text-ink-900">Countries</dt><dd className="text-ink-700">Worldwide, except Africa</dd></div>
          </dl>
          <LinkButton href="/contact" variant="secondary" className="w-full">Ask a question</LinkButton>
          <p className="text-xs text-ink-600">{NO_GUARANTEE_STATEMENT} All awards are subject to formal approval, applicable law, verified funding availability and final programme rules. {ORG.name} is an independent organization and not a government agency.</p>
        </aside>
      </div>
    </ContentPage>
  );
}
