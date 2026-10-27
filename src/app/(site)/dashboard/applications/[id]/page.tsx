import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApplicant } from "@/lib/auth/session";
import { getApplicantApplicationDetail } from "@/lib/services/applications";
import { NotFoundError } from "@/lib/permissions";
import { STATUS_APPLICANT_EXPLANATION, STATUS_LABELS, APPLICANT_EDITABLE, type ApplicationStatus } from "@/lib/constants";
import { Timeline } from "@/components/dashboard/timeline";
import { AwardPanel } from "@/components/dashboard/award-panel";
import { ReplyForm, WithdrawForm } from "@/components/dashboard/application-actions";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DemoBadge, StatusBadge } from "@/components/ui/badge";
import { Alert, DefinitionList, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatMinor } from "@/lib/money";

export const metadata: Metadata = { title: "Track application" };

const WITHDRAWABLE: ApplicationStatus[] = ["DRAFT", "SUBMITTED", "INITIAL_REVIEW", "UNDER_REVIEW", "INFO_REQUESTED", "RESUBMISSION_REQUIRED"];
const MSG_LABEL: Record<string, string> = { INFO_REQUEST: "Information requested", REVISION_REQUEST: "Revision requested", APPLICANT_RESPONSE: "Your reply", DECISION: "Decision message", GENERAL: "Message" };

export default async function TrackApplication({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ submitted?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireApplicant(`/dashboard/applications/${id}`);
  let app;
  try {
    app = await getApplicantApplicationDetail({ id: user.id, role: user.role, name: user.name }, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const status = app.status as ApplicationStatus;
  const editable = APPLICANT_EDITABLE.includes(status);
  const openRequest = status === "INFO_REQUESTED" ? [...app.messages].reverse().find((m) => m.kind === "INFO_REQUEST") : null;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Application tracking" title={app.reference ?? "Draft application"}
        description={<>{app.opportunity.title}{app.organization ? ` · for ${app.organization.name}` : ""}</>}
        actions={editable ? <LinkButton variant="accent" href={`/dashboard/applications/${app.id}/edit`}>{status === "DRAFT" ? "Continue draft" : "Edit & resubmit"}</LinkButton> : undefined} />
      {sp.submitted === "1" && app.reference && status !== "DRAFT" ? (
        <Alert tone="ok" title="Application submitted">Your reference number is <strong>{app.reference}</strong>. Keep it for any correspondence. Submitting does not guarantee approval or payment.</Alert>
      ) : null}

      <Card><CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-3"><StatusBadge status={app.status} />{app.opportunity.classification === "DEMO" ? <DemoBadge /> : null}</div>
        <p className="text-ink-800">{STATUS_APPLICANT_EXPLANATION[status]}</p>
        <DefinitionList items={[
          { label: "Application reference", value: app.reference ?? "Assigned on submission" },
          { label: "Opportunity", value: <Link className="underline" href={`/opportunities/${app.opportunity.slug}`}>{app.opportunity.title} ({app.opportunity.reference})</Link> },
          { label: "Submitted", value: formatDate(app.submittedAt) },
          { label: "Current status", value: STATUS_LABELS[status] },
          { label: "Last updated", value: formatDateTime(app.updatedAt) },
          { label: "Decision date", value: app.decidedAt ? formatDate(app.decidedAt) : "No decision yet" },
          ...(app.requestedAmountMinor != null ? [{ label: "Amount you requested", value: formatMinor(app.requestedAmountMinor, app.opportunity.currency) }] : []),
        ]} />
      </CardBody></Card>

      {openRequest ? (
        <Card className="border-warn-700/40"><CardHeader title="The review team needs more information" /><CardBody className="space-y-4">
          <blockquote className="rounded-lg bg-warn-50 p-4 text-sm text-ink-900"><p className="whitespace-pre-line">{openRequest.body}</p><footer className="mt-2 text-xs text-ink-600">{formatDateTime(openRequest.createdAt)}</footer></blockquote>
          <ReplyForm applicationId={app.id} />
        </CardBody></Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Progress timeline" description="Every status change is recorded." /><CardBody><Timeline events={app.events} /></CardBody></Card>
        <Card><CardHeader title="Messages from the review team" /><CardBody>
          {app.messages.length === 0 ? <p className="text-sm text-ink-600">No messages yet. Requests for information and decisions will appear here.</p> : (
            <ul className="space-y-3">{app.messages.map((m) => (
              <li key={m.id} className={`rounded-lg p-3 text-sm ${m.kind === "APPLICANT_RESPONSE" ? "bg-navy-50" : "bg-sand-100"}`}>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-600">{MSG_LABEL[m.kind] ?? "Message"} · {formatDateTime(m.createdAt)}</p>
                <p className="mt-1 whitespace-pre-line text-ink-900">{m.body}</p>
              </li>))}</ul>)}
        </CardBody></Card>
      </div>

      {app.award ? <Card><CardHeader title="Award and disbursement records" /><CardBody><AwardPanel award={app.award} /></CardBody></Card> : null}

      <Card><CardHeader title="Your answers" description="A read-only copy of what you submitted." /><CardBody>
        {app.answers.length === 0 ? <p className="text-sm text-ink-600">No answers saved yet.</p> : (
          <dl className="space-y-4">{app.answers.map((a) => (
            <div key={a.questionKey}><dt className="text-sm font-semibold text-ink-900">{a.questionLabel}</dt><dd className="mt-0.5 whitespace-pre-line text-sm text-ink-700">{a.value.startsWith("[") ? (() => { try { return (JSON.parse(a.value) as string[]).join(", "); } catch { return a.value; } })() : a.value === "YES" ? "Yes" : a.value === "NO" ? "No" : a.value}</dd></div>))}</dl>)}
      </CardBody></Card>

      <div className="flex flex-wrap items-start gap-4">
        {WITHDRAWABLE.includes(status) ? <div className="min-w-72 flex-1"><WithdrawForm applicationId={app.id} /></div> : null}
        <LinkButton variant="outline" href={`/contact${app.reference ? `?ref=${app.reference}` : ""}`}>Contact support about this application</LinkButton>
      </div>
    </div>
  );
}
