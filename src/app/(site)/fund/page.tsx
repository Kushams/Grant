import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { ContentPage } from "@/components/content/prose";
import { NO_GUARANTEE_STATEMENT, ORG } from "@/config/organization";
import { GENERAL_FUND_SLUG, fundHasOpened, fundOpensLabel } from "@/config/general-fund";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "General Opportunity Fund",
  description: "About the National Empowerment Network General Opportunity Fund: who may apply, what it may support, how applications will be evaluated and current application status.",
};

const TIERS = [
  ["Tier 1 — Emergency and immediate needs", "For qualifying urgent circumstances and time-sensitive opportunities, subject to the programme’s approved emergency-grant criteria."],
  ["Tier 2 — Individual and development grants", "For eligible individuals pursuing education, training, professional advancement, creative work or other approved opportunities."],
  ["Tier 3 — Project and community grants", "For eligible projects, initiatives, ventures and community-focused activities with clear objectives and a realistic implementation plan."],
  ["Tier 4 — Institutional and strategic grants", "For larger eligible initiatives or organizations requiring substantial funding, appropriate due diligence, governance and impact assessment."],
] as const;

const CRITERIA = [
  ["Purpose and relevance", "How well the proposal fits the Fund’s objectives."],
  ["Need and opportunity", "The circumstances and barriers the proposal addresses."],
  ["Potential impact", "The expected benefits and who will benefit."],
  ["Feasibility", "Whether the plan, timeline and proposed outcomes are realistic."],
  ["Budget", "Whether the requested amount is reasonable and properly explained."],
  ["Accountability", "The applicant’s ability to manage funds and meet reporting requirements."],
] as const;

export default async function FundPage() {
  const live = await db.opportunity.findFirst({ where: { slug: GENERAL_FUND_SLUG, status: "PUBLISHED" }, select: { slug: true } });
  const opened = fundHasOpened();
  return (
    <ContentPage wide eyebrow="Programme" title="General Opportunity Fund" intro="Expanding access to funding for people, ideas and initiatives with the potential to create meaningful personal, professional, economic and community impact.">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="prose-nen max-w-none space-y-2">
          <h2>About the Fund</h2>
          <p>The {ORG.name} General Opportunity Fund provides a broad pathway for eligible applicants whose goals and projects may not fit within a specialized funding category — from individuals pursuing new opportunities to entrepreneurs, creatives and organizations delivering community initiatives.</p>
          <p>The approach is built around accessibility, fairness, responsible funding, transparent evaluation and measurable impact.</p>

          <h2>Who can apply</h2>
          <p>Subject to the final eligibility rules, applications may be considered from:</p>
          <ul>
            <li>Individuals pursuing meaningful personal or professional opportunities.</li>
            <li>Aspiring entrepreneurs and eligible small businesses.</li>
            <li>Artists, creatives, independent professionals and innovators.</li>
            <li>Students and people seeking skills development or career advancement.</li>
            <li>Community groups and grassroots initiatives.</li>
            <li>Eligible nonprofit organizations, educational institutions and other qualifying organizations.</li>
            <li>Applicants in the United States and eligible international locations.</li>
          </ul>
          <p>Applicants must satisfy the requirements of the relevant funding tier, applicable laws and any programme-specific restrictions. Not every applicant or proposed activity will necessarily qualify.</p>

          <h2>What the Fund may support</h2>
          <ul>
            <li><strong>Personal and professional development</strong> — skills training, certifications, career development and initiatives that improve access to opportunity.</li>
            <li><strong>Entrepreneurship and economic empowerment</strong> — qualifying business development, early-stage ventures, tools, equipment and resources for an approved project.</li>
            <li><strong>Creative projects and innovation</strong> — artistic initiatives, new concepts, research and practical solutions to identified challenges.</li>
            <li><strong>Education and learning</strong> — learning resources, training initiatives and programmes that expand access to knowledge and skills.</li>
            <li><strong>Community initiatives</strong> — projects that strengthen communities or deliver demonstrable public benefit.</li>
            <li><strong>Other qualifying opportunities</strong> that meet the Fund’s published objectives and eligibility criteria.</li>
          </ul>

          <h2>Tiered structure</h2>
          <p>A tiered approach lets funding decisions reflect the scale, needs and expected impact of each eligible proposal.</p>
          <ul>{TIERS.map(([t, d]) => <li key={t}><strong>{t}.</strong> {d}</li>)}</ul>
          <p>Award ranges, eligibility rules and payment schedules for each tier will be published in the official grant guidelines before applications open.</p>

          <h2>How applications will be evaluated</h2>
          <p>A consistent review process considers:</p>
          <ul>{CRITERIA.map(([t, d]) => <li key={t}><strong>{t}:</strong> {d}</li>)}</ul>
          <p>Additional verification or documentation may be required depending on the size, nature and location of the proposed award.</p>

          <h2>Fairness, transparency and accountability</h2>
          <p>Applications are assessed under published criteria and consistent procedures. Decisions are subject to eligibility checks, conflict-of-interest safeguards, available programme funds, applicable law and formal authorization by the Board of Directors or its authorized delegates. Successful applicants may be required to sign a grant agreement, use funds only for approved purposes and report on expenditure and outcomes.</p>

          <h2>Staying safe</h2>
          <p>Applying is free. {ORG.name} will never ask you to pay a fee to receive an award, and never needs your Social Security number, bank or card details to consider an application. Read our <Link href="/fraud-prevention">fraud prevention guidance</Link>.</p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Alert tone="info" title="Application status">
            {live && opened
              ? <><strong>Applications are open.</strong> You can apply now.</>
              : <><strong>Applications open on {fundOpensLabel()}.</strong> Nothing is collected before then.</>}
          </Alert>
          {live && opened ? <LinkButton href={`/opportunities/${GENERAL_FUND_SLUG}`} size="lg" className="w-full">Apply now</LinkButton> : null}
          <dl className="space-y-3 rounded-xl border border-ink-200 bg-white p-4 text-sm shadow-[var(--shadow-card)]">
            <div><dt className="font-semibold text-ink-900">Opening date</dt><dd className="text-ink-700">{fundOpensLabel()}</dd></div>
            <div><dt className="font-semibold text-ink-900">Award ranges by tier</dt><dd className="text-ink-700">To be published in the official guidelines</dd></div>
            <div><dt className="font-semibold text-ink-900">Application portal</dt><dd className="text-ink-700">To be confirmed</dd></div>
            <div><dt className="font-semibold text-ink-900">Geographic eligibility</dt><dd className="text-ink-700">To be published before applications open</dd></div>
          </dl>
          <LinkButton href="/contact" variant="secondary" className="w-full">Ask a question</LinkButton>
          <p className="text-xs text-ink-600">{NO_GUARANTEE_STATEMENT} All awards are subject to formal approval, applicable law, verified funding availability and final programme rules. {ORG.name} is an independent organization and not a government agency.</p>
        </aside>
      </div>
    </ContentPage>
  );
}
