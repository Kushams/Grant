import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublishedBySlug, isSaved, relatedOpportunities } from "@/lib/services/opportunities";
import { checkEligibility } from "@/lib/eligibility";
import { fundingLabel, applicantTypeLabel } from "@/lib/opportunity-display";
import { formatDate } from "@/lib/format";
import { isApplicantRole, INDIVIDUAL_CATEGORIES } from "@/lib/constants";
import { NO_FEE_STATEMENT, NO_GUARANTEE_STATEMENT } from "@/config/organization";
import { startApplicationAction, toggleSavedAction } from "@/app/actions/applicant";
import { Badge, DemoBadge, OpportunityStateBadge } from "@/components/ui/badge";
import { Alert, DefinitionList, Unconfirmed } from "@/components/ui/misc";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { BulletList, Section } from "@/components/opportunities/section";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { memberOrganizationIds } from "@/lib/services/applications";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ apply_error?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = await getPublishedBySlug((await params).slug);
  return o ? { title: o.title, description: o.shortDescription } : { title: "Opportunity not found" };
}

export default async function OpportunityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const o = await getPublishedBySlug(slug);
  if (!o) notFound();
  const user = await getCurrentUser();
  const applicantUser = user && isApplicantRole(user.role) ? user : null;
  const saved = applicantUser ? await isSaved(applicantUser.id, o.id) : false;
  const related = await relatedOpportunities(o);
  const back = `/opportunities/${o.slug}`;

  // Personalised eligibility preview + existing application lookup (UI only; the server re-checks everything).
  let eligibility: { eligible: boolean; reasons: string[]; as: string } | null = null;
  let existing: { id: string; status: string } | null = null;
  if (applicantUser) {
    if (applicantUser.role === "INDIVIDUAL_APPLICANT") {
      const results = INDIVIDUAL_CATEGORIES.map((c) => ({ c, r: checkEligibility(o, c) }));
      const ok = results.find((x) => x.r.eligible);
      eligibility = ok ? { eligible: true, reasons: [], as: applicantTypeLabel(ok.c) } : { ...results[0].r, as: "Individual" };
      existing = await db.application.findFirst({ where: { opportunityId: o.id, applicantUserId: applicantUser.id, organizationId: null, status: { not: "WITHDRAWN" } }, orderBy: { createdAt: "desc" }, select: { id: true, status: true } });
    } else {
      const orgIds = await memberOrganizationIds(applicantUser.id);
      const org = orgIds[0] ? await db.organizationProfile.findUnique({ where: { id: orgIds[0] } }) : null;
      if (org) {
        const r = checkEligibility(o, org.type);
        eligibility = { ...r, as: applicantTypeLabel(org.type) };
        existing = await db.application.findFirst({ where: { opportunityId: o.id, organizationId: org.id, status: { not: "WITHDRAWN" } }, orderBy: { createdAt: "desc" }, select: { id: true, status: true } });
      }
    }
  }
  const funding = fundingLabel(o);
  const feeClean = o.feePolicyStatus === "NONE";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-600">
        <Link href="/opportunities" className="underline">Opportunities</Link> <span aria-hidden="true">/</span> <span>{o.title}</span>
      </nav>
      <header className="mb-8 max-w-4xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {o.isDemo ? <DemoBadge /> : <Badge tone="ok">Verified programme</Badge>}
          <OpportunityStateBadge state={o.window.state} />
          <Badge tone="navy">{o.category}</Badge>
        </div>
        <h1 className="text-4xl font-semibold">{o.title}</h1>
        <p className="mt-3 text-lg text-ink-700">{o.shortDescription}</p>
        <p className="mt-2 text-sm text-ink-600">Reference <strong>{o.reference}</strong></p>
      </header>

      {o.isDemo ? (
        <Alert tone="warn" className="mb-8" title="This is a fictional demonstration">
          This opportunity exists only to test the platform. The programme, funder, amounts, dates and rules are invented — nobody can receive funding from it.
        </Alert>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <Section id="about" title="About this programme"><p className="whitespace-pre-line">{o.description}</p></Section>

          <Section id="eligibility" title="Eligibility">
            <p className="font-semibold text-ink-900">Accepted applicant types</p>
            {o.applicantTypeList.length ? <div className="flex flex-wrap gap-2">{o.applicantTypeList.map((t) => <Badge key={t} tone="navy">{applicantTypeLabel(t)}</Badge>)}</div> : <p><Unconfirmed /></p>}
            <p className="pt-2 font-semibold text-ink-900">Eligible countries and regions</p>
            {o.regionList.length ? <p>{o.regionList.join(" · ")}</p> : <p><Unconfirmed /></p>}
            <p className="pt-2 font-semibold text-ink-900">Eligibility criteria</p>
            <BulletList items={o.criteria} empty="Details to be confirmed" />
          </Section>

          <Section id="funding" title="Funding and award structure">
            <DefinitionList items={[
              { label: "Funding", value: funding ?? <Unconfirmed /> },
              { label: "Currency", value: o.fundingSpecified ? o.currency : <Unconfirmed /> },
              { label: "Award type", value: o.awardType ?? <Unconfirmed /> },
              { label: "Permitted use", value: o.fundingPurpose ?? <Unconfirmed /> },
              { label: "Planned instalments", value: o.plannedInstallments ?? <Unconfirmed /> },
              { label: "Expected payment schedule", value: o.paymentSchedule ?? <Unconfirmed /> },
            ]} />
            {o.fundingTerms ? <p><strong className="text-ink-900">Funding terms:</strong> {o.fundingTerms}</p> : null}
            {o.milestones ? <p><strong className="text-ink-900">Milestones:</strong> {o.milestones}</p> : null}
            {o.disbursementConditions ? <p><strong className="text-ink-900">Conditions attached to disbursement:</strong> {o.disbursementConditions}</p> : null}
            <Alert tone="info" title="Fees and guarantees">
              <p>{feeClean ? NO_FEE_STATEMENT : "See the verified programme terms for any charges."}</p>
              <p>{NO_GUARANTEE_STATEMENT} Never pay anyone to “release” or “unlock” an award — see <Link className="underline" href="/fraud-prevention">fraud prevention</Link>.</p>
            </Alert>
          </Section>

          <Section id="apply-info" title="What you will need to apply">
            <p className="font-semibold text-ink-900">Required information</p>
            <BulletList items={o.requiredInfo} empty="Details to be confirmed" />
            <p className="pt-2 font-semibold text-ink-900">Required documents</p>
            <BulletList items={o.requiredDocs} empty="No documents are required for this demonstration. Please do not upload identity or financial documents to this prototype." />
            {o.questions.length ? <p className="pt-2 text-sm">The application includes {o.questions.length} programme-specific question{o.questions.length === 1 ? "" : "s"} ({o.questions.filter((q) => q.required).length} required).</p> : null}
          </Section>

          <Section id="process" title="Dates and review process">
            <DefinitionList items={[
              { label: "Applications open", value: o.opensAt ? formatDate(o.opensAt) : <Unconfirmed /> },
              { label: "Deadline", value: o.deadline ? formatDate(o.deadline) : <Unconfirmed /> },
              { label: "Expected decision timeline", value: o.decisionTimeline ?? <Unconfirmed /> },
              { label: "Funding organization", value: o.funderName && o.funderVerified ? o.funderName : <Unconfirmed /> },
            ]} />
            <p className="pt-2 font-semibold text-ink-900">Selection and review process</p>
            <p>{o.selectionProcess ?? <Unconfirmed />}</p>
          </Section>

          <Section id="terms" title="Programme terms">
            {o.programmeTerms ? <p className="whitespace-pre-line">{o.programmeTerms}</p> : <p><Unconfirmed /></p>}
            {!o.termsApproved ? <p className="text-sm italic">These terms have not been approved by the organization (demo content).</p> : null}
          </Section>

          {o.faqList.length ? (
            <Section id="faq" title="Frequently asked questions">
              <div className="divide-y divide-ink-200 rounded-lg border border-ink-200 bg-white">
                {o.faqList.map((f) => (
                  <details key={f.q} className="group p-4"><summary className="cursor-pointer font-semibold text-ink-900">{f.q}</summary><p className="mt-2">{f.a}</p></details>
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Apply and key facts">
          <Card><CardBody className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-600">Funding</p>
              <p className="font-display text-2xl font-semibold text-navy-900">{funding ?? "To be confirmed"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-600">Deadline</p>
              <p className="font-semibold text-ink-900">{o.deadline ? formatDate(o.deadline) : "To be confirmed"}</p>
            </div>

            {sp.apply_error ? <Alert tone="bad" title="Couldn’t start your application">{sp.apply_error}</Alert> : null}

            {!user ? (
              <div className="space-y-2">
                <LinkButton href={`/login?next=${encodeURIComponent(back)}`} size="lg" className="w-full">Sign in to apply</LinkButton>
                <LinkButton href="/register" variant="outline" className="w-full">Create an account</LinkButton>
              </div>
            ) : !applicantUser ? (
              <Alert tone="info">Staff accounts cannot apply. Sign in with an applicant account to test the application flow.</Alert>
            ) : (
              <div className="space-y-3">
                {eligibility && !eligibility.eligible ? <Alert tone="warn" title="You can’t apply to this one">{eligibility.reasons.join(" ")}</Alert> : null}
                {eligibility?.eligible ? <p className="text-sm text-ok-700">✓ Your applicant type ({eligibility.as}) is accepted.</p> : null}
                {!eligibility && applicantUser.role === "ORGANIZATION_APPLICANT" ? <Alert tone="warn">Create your organization profile before applying.</Alert> : null}
                {existing ? (
                  <LinkButton href={existing.status === "DRAFT" || existing.status === "RESUBMISSION_REQUIRED" ? `/dashboard/applications/${existing.id}/edit` : `/dashboard/applications/${existing.id}`} size="lg" className="w-full">
                    {existing.status === "DRAFT" ? "Continue your draft" : existing.status === "RESUBMISSION_REQUIRED" ? "Edit and resubmit" : "View your application"}
                  </LinkButton>
                ) : (
                  <form action={startApplicationAction}>
                    <input type="hidden" name="slug" value={o.slug} />
                    <Button type="submit" size="lg" className="w-full" disabled={!!eligibility && !eligibility.eligible}>Start application</Button>
                  </form>
                )}
                <form action={toggleSavedAction}>
                  <input type="hidden" name="opportunityId" value={o.id} />
                  <input type="hidden" name="back" value={back} />
                  <Button type="submit" variant="outline" className="w-full" aria-pressed={saved}>
                    {saved ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
                    {saved ? "Saved — remove bookmark" : "Save for later"}
                  </Button>
                </form>
              </div>
            )}
            <p className="text-xs text-ink-600">{NO_GUARANTEE_STATEMENT}</p>
          </CardBody></Card>
        </aside>
      </div>

      {related.length ? (
        <section aria-labelledby="related-h" className="mt-14">
          <h2 id="related-h" className="mb-4 text-2xl font-semibold">Related opportunities</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <li key={r.id}><OpportunityCard o={r} /></li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}
