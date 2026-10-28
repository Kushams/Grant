import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { ContentPage } from "@/components/content/prose";
import { NO_GUARANTEE_STATEMENT, ORG } from "@/config/organization";
import { GENERAL_FUND_SLUG, fundHasOpened, fundOpensLabel } from "@/config/general-fund";
import { db } from "@/lib/db";
import { formatMinor } from "@/lib/money";

export const metadata: Metadata = {
  title: "General Opportunity Fund",
  description: "About the National Empowerment Network General Opportunity Fund: who may apply, what it may support, how applications will be evaluated and current application status.",
};

const CRITERIA = [
  ["Purpose and relevance", "How well the proposal fits the Fund’s objectives."],
  ["Need and opportunity", "The circumstances and barriers the proposal addresses."],
  ["Potential impact", "The expected benefits and who will benefit."],
  ["Feasibility", "Whether the plan, timeline and proposed outcomes are realistic."],
  ["Budget", "Whether the requested amount is reasonable and properly explained."],
  ["Accountability", "The applicant’s ability to manage funds and meet reporting requirements."],
] as const;

export default async function FundPage() {
  const row = await db.opportunity.findFirst({ where: { slug: GENERAL_FUND_SLUG, status: "PUBLISHED" }, select: { slug: true, currency: true, minAmountMinor: true, maxAmountMinor: true } });
  const live = row ? { ...row, range: row.minAmountMinor != null && row.maxAmountMinor != null ? `${formatMinor(row.minAmountMinor, row.currency)} to ${formatMinor(row.maxAmountMinor, row.currency)}` : null } : null;
  const opened = fundHasOpened();
  return (
    <ContentPage wide eyebrow="Programme" title="General Opportunity Fund" intro="Expanding access to funding for people, ideas and initiatives with the potential to create meaningful personal, professional, economic and community impact.">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="prose-nen max-w-none space-y-2">
          <h2>About the Fund</h2>
          <p>The {ORG.name} General Opportunity Fund provides a broad pathway for eligible applicants whose goals and projects may not fit within a specialized funding category — from individuals pursuing new opportunities to entrepreneurs, creatives and organizations delivering community initiatives.</p>
          <p>The approach is built around accessibility, fairness, responsible funding, transparent evaluation and measurable impact.</p>

          <h2 id="who-can-apply">Who can apply</h2>
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

          <h2 id="how-it-works">How it works</h2>
          <ol>
            <li><strong>Create an account.</strong> Use a passkey or access code — no email needed — or register with email and password.</li>
            <li><strong>Fill in the short application.</strong> Who you are, what the funding is for, the amount you are requesting and a brief budget.</li>
            <li><strong>Review.</strong> Your application is checked for completeness and eligibility and assessed against the published criteria.</li>
            <li><strong>Decision.</strong> The Board of Directors decides and records the reason. You can track every step from your dashboard.</li>
            <li><strong>If approved,</strong> you receive written award terms and instructions for the next steps. Any identity verification happens after approval, through a secure process.</li>
          </ol>

          <h2>What the Fund may support</h2>
          <ul>
            <li><strong>Personal and professional development</strong> — skills training, certifications, career development and initiatives that improve access to opportunity.</li>
            <li><strong>Entrepreneurship and economic empowerment</strong> — qualifying business development, early-stage ventures, tools, equipment and resources for an approved project.</li>
            <li><strong>Creative projects and innovation</strong> — artistic initiatives, new concepts, research and practical solutions to identified challenges.</li>
            <li><strong>Education and learning</strong> — learning resources, training initiatives and programmes that expand access to knowledge and skills.</li>
            <li><strong>Community initiatives</strong> — projects that strengthen communities or deliver demonstrable public benefit.</li>
            <li><strong>Other qualifying opportunities</strong> that meet the Fund’s published objectives and eligibility criteria.</li>
          </ul>

          <h2>Requesting an amount</h2>
          <p>You tell us how much you need. Your application explains the purpose of the request, how the money would be used (a short budget) and why the amount is appropriate. The Board may approve the full amount, a different amount, or decline. Requests are never guaranteed.</p>

          <h2>How applications will be evaluated</h2>
          <p>A consistent review process considers:</p>
          <ul>{CRITERIA.map(([t, d]) => <li key={t}><strong>{t}:</strong> {d}</li>)}</ul>
          <p>Additional verification or documentation may be required depending on the size, nature and location of the proposed award.</p>

          <h2>Fairness, transparency and accountability</h2>
          <p>Applications are assessed under published criteria and consistent procedures. Decisions are subject to eligibility checks, conflict-of-interest safeguards, available programme funds, applicable law and formal authorization by the Board of Directors or its authorized delegates. Successful applicants may be required to sign a grant agreement, use funds only for approved purposes and report on expenditure and outcomes.</p>

          <h2>Staying safe</h2>
          <p>Applying is free. {ORG.name} will never ask you to pay a fee to receive an award, and never needs your Social Security number, bank or card details to consider an application. Read our <Link href="/faq#safety">fraud prevention guidance</Link>.</p>
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
            <div><dt className="font-semibold text-ink-900">Amount you can request</dt><dd className="text-ink-700">{live?.range ?? "Shown when applications open"}</dd></div>
            <div><dt className="font-semibold text-ink-900">Where to apply</dt><dd className="text-ink-700">On this website</dd></div>
            <div><dt className="font-semibold text-ink-900">Countries</dt><dd className="text-ink-700">United States and eligible international locations</dd></div>
          </dl>
          <LinkButton href="/contact" variant="secondary" className="w-full">Ask a question</LinkButton>
          <p className="text-xs text-ink-600">{NO_GUARANTEE_STATEMENT} All awards are subject to formal approval, applicable law, verified funding availability and final programme rules. {ORG.name} is an independent organization and not a government agency.</p>
        </aside>
      </div>
    </ContentPage>
  );
}
