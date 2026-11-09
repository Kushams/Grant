import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getFundApplicationStaff } from "@/lib/services/fund-applications";
import { NotFoundError } from "@/lib/permissions";
import { fundApplicationNoteAction, fundApplicationStatusAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextArea } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, DefinitionList, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { APPLICANT_TYPE_LABELS, FUND_APPLICATION_STATUSES, FUND_APPLICATION_STATUS_LABELS, type ApplicantType, type FundApplicationStatus } from "@/lib/constants";
import { formatMinor } from "@/lib/money";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Fund application" };

export default async function FundApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission("support:manage", `/admin/fund-applications/${id}`);
  let data;
  try { data = await getFundApplicationStaff({ id: user.id, role: user.role, name: user.name }, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const { app, authors } = data;
  return (
    <div className="space-y-6">
      <p className="text-sm"><Link href="/admin/fund-applications" className="underline">← Fund applications</Link></p>
      <PageHeader title={app.reference} description={`${app.fullName} — ${APPLICANT_TYPE_LABELS[app.applicantType as ApplicantType] ?? app.applicantType}`} />
      <Card><CardBody className="space-y-4">
        <DefinitionList items={[
          { label: "Applicant", value: app.fullName },
          { label: "Email", value: app.email },
          { label: "Phone", value: app.phone ?? "Not given" },
          { label: "Country", value: app.country },
          { label: "Amount requested", value: formatMinor(app.amountMinor, app.currency) },
          { label: "Conflict of interest", value: app.hasConflict ? `Yes — ${app.conflictDetails ?? "no details given"}` : "No" },
          { label: "Received", value: formatDateTime(app.createdAt) },
          { label: "Consent to privacy notice", value: formatDateTime(app.consentAt) },
          { label: "Status", value: <Badge tone="info">{FUND_APPLICATION_STATUS_LABELS[app.status as FundApplicationStatus] ?? app.status}</Badge> },
        ]} />
        {app.story ? <div><h3 className="text-sm font-semibold text-ink-900">About the applicant</h3><p className="mt-1 whitespace-pre-line rounded-lg bg-sand-100 p-4 text-sm text-ink-900">{app.story}</p></div> : null}
        <div><h3 className="text-sm font-semibold text-ink-900">What the funding is for</h3><p className="mt-1 whitespace-pre-line rounded-lg bg-sand-100 p-4 text-sm text-ink-900">{app.purpose}</p></div>
        <div><h3 className="text-sm font-semibold text-ink-900">How the money would be used</h3><p className="mt-1 whitespace-pre-line rounded-lg bg-sand-100 p-4 text-sm text-ink-900">{app.useOfFunds}</p></div>
        <div><h3 className="text-sm font-semibold text-ink-900">Budget summary</h3><p className="mt-1 whitespace-pre-line rounded-lg bg-sand-100 p-4 text-sm text-ink-900">{app.budgetSummary}</p></div>
      </CardBody></Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Status" /><CardBody>
          <ActionForm action={fundApplicationStatusAction} hidden={{ id: app.id }} submitLabel="Update">
            <SelectField label="Status" name="status" defaultValue={app.status} options={FUND_APPLICATION_STATUSES.map((s) => ({ value: s, label: FUND_APPLICATION_STATUS_LABELS[s] }))} />
          </ActionForm>
        </CardBody></Card>
        <Card><CardHeader title="Add an internal note" /><CardBody>
          <ActionForm action={fundApplicationNoteAction} hidden={{ id: app.id }} submitLabel="Save note">
            <TextArea label="Note (staff only — never shown to the applicant)" name="body" required rows={3} />
          </ActionForm>
        </CardBody></Card>
      </div>
      <Card><CardHeader title="Internal notes" /><CardBody>
        {app.notes.length === 0 ? <p className="text-sm text-ink-600">No notes yet.</p> : <ul className="space-y-3">{app.notes.map((n) => (
          <li key={n.id} className="rounded-lg bg-warn-50 p-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-700">Internal · {authors[n.authorId] ?? "Staff"} · {formatDateTime(n.createdAt)}</p>
            <p className="mt-1 whitespace-pre-line">{n.body}</p></li>))}</ul>}
      </CardBody></Card>
      <Alert tone="info">The applicant has no account and nothing is emailed from this screen. Contact them about the outcome only, using the email or phone number they supplied. Never ask an applicant to pay a fee, and never ask for ID, SSN or bank details at this stage.</Alert>
    </div>
  );
}
