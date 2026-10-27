import { DEMO_SITE } from "@/config/organization";
import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { ORG } from "@/config/organization";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <ContentPage eyebrow="About" title={`About ${ORG.name}`} intro={ORG.description}>
      <h2>What we are</h2>
      <p>{ORG.name} ({ORG.abbreviation}) is an independent opportunity-access and empowerment platform. It is being developed by a new company, with the intention of working alongside an NGO partner and, in time, other verified organizations.</p>
      <p><strong>We are not a government agency</strong> and we do not operate any official government programme. We do not use government seals or logos, and we do not claim government endorsement. Any partnership or funder will be named on this site only after it has been confirmed in writing.</p>
      <h2>Our proposed mission</h2>
      <p>{ORG.missionDraft}</p>
      <p><em>This mission statement is proposed wording for review and is not yet an approved statement of the organization.</em></p>
      <h2>How we work</h2>
      <ul>
        <li><strong>One place to look.</strong> Programmes are listed with their eligibility rules, dates and terms side by side so they are easy to compare.</li>
        <li><strong>Clear rules.</strong> Each opportunity sets its own eligibility, funding structure and review process. Participation depends on the verified terms of that opportunity.</li>
        <li><strong>Honest tracking.</strong> Applicants can see their status, a timeline of every change and any questions from reviewers.</li>
        <li><strong>Separated decisions.</strong> Reviewers recommend; a separate administrator records final decisions. Every sensitive action is written to an audit log.</li>
      </ul>
      <h2>Transparency principles</h2>
      <ul>
        <li>No guaranteed outcomes, and no invented statistics, beneficiaries or testimonials.</li>
        <li>No application fee or upfront payment is requested. Any future charge would need documented approval and clear disclosure in the programme terms before an applicant proceeds.</li>
        {DEMO_SITE ? <li>Opportunities that are demonstrations are always labelled <strong>DEMO — NOT A LIVE FUNDING OPPORTUNITY</strong>.</li> : null}
        <li>We collect only the data needed to review an application and never ask for government ID numbers, bank details or card data.</li>
      </ul>
      <h2>Who it is for</h2>
      <p>Individuals, entrepreneurs, small and established businesses, nonprofits, community organizations and other entities that a programme chooses to accept.</p>
      <div className="mt-8 flex flex-wrap gap-3 not-prose"><LinkButton href="/opportunities">Explore opportunities</LinkButton><LinkButton href="/how-it-works" variant="outline">How it works</LinkButton></div>
    </ContentPage>
  );
}
