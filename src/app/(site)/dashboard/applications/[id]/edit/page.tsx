import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireApplicant } from "@/lib/auth/session";
import { getApplicationForEdit } from "@/lib/services/applications";
import { NotFoundError } from "@/lib/permissions";
import { ApplicationWizard } from "@/components/application/wizard";
import { fundingLabel } from "@/lib/opportunity-display";
import { isIndividualApplyReady, isOrganizationApplyReady } from "@/lib/validation/profile";
import { minorToInputValue } from "@/lib/money";

export const metadata: Metadata = { title: "Application" };

export default async function EditApplication({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireApplicant(`/dashboard/applications/${id}/edit`);
  let data;
  try {
    data = await getApplicationForEdit({ id: user.id, role: user.role, name: user.name }, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  if (!data.editable) redirect(`/dashboard/applications/${id}`);
  const { app, opp, answers, individual, orgs } = data;
  const revision = app.status === "RESUBMISSION_REQUIRED"
    ? await db.applicationMessage.findFirst({ where: { applicationId: app.id, kind: "REVISION_REQUEST" }, orderBy: { createdAt: "desc" }, select: { body: true } })
    : null;
  return (
    <ApplicationWizard
      applicationId={app.id}
      reference={app.reference}
      status={app.status}
      startStep={app.currentStep}
      mode={app.applicantMode as "INDIVIDUAL" | "ORGANIZATION"}
      category={app.applicantCategory}
      organizationId={app.organizationId ?? ""}
      opportunity={{
        title: opp.title, slug: opp.slug, reference: opp.reference, isDemo: opp.isDemo, currency: opp.currency, fundingSpecified: opp.fundingSpecified,
        fixedAmountMinor: opp.fixedAmountMinor, minAmountMinor: opp.minAmountMinor, maxAmountMinor: opp.maxAmountMinor, fundingText: fundingLabel(opp),
        requireProposal: opp.requireProposal, hasTerms: !!opp.programmeTerms, acceptedTypes: opp.applicantTypeList, requiredDocs: opp.requiredDocs, requiredInfo: opp.requiredInfo,
        questions: opp.questions.map((q) => ({ key: q.key, label: q.label, helpText: q.helpText, type: q.type, optionList: q.optionList, required: q.required, section: q.section })),
      }}
      organizations={orgs.map((o) => ({ id: o.id, name: o.name, type: o.type, country: o.country, contactEmail: o.contactEmail, ready: isOrganizationApplyReady(o) }))}
      individual={individual ? { fullName: individual.fullName, country: individual.country, city: individual.city, ready: isIndividualApplyReady(individual) } : null}
      answers={answers}
      requestedAmount={minorToInputValue(app.requestedAmountMinor, opp.currency)}
      revisionNote={revision?.body ?? null}
    />
  );
}
