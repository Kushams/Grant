import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getAwardAdmin } from "@/lib/services/awards";
import { NotFoundError, can } from "@/lib/permissions";
import { DISBURSEMENT_TRANSITIONS, isOverdue } from "@/lib/awards-calc";
import { formatMinor, minorToInputValue } from "@/lib/money";
import { AddInstalmentForm, AmountForm, AwardEditForm, InstalmentEditForm, InstalmentStatusForm } from "@/components/admin/award-forms";
import { Badge, DemoBadge, DisbursementBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, DefinitionList, PageHeader } from "@/components/ui/misc";
import { formatDate, formatDateTime, dateInputValue } from "@/lib/format";
import { LOCKED_FOR_EDIT } from "@/lib/awards-calc";
import type { DisbursementStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "Award" };

export default async function AwardDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePermission("award:view", `/admin/awards/${id}`);
  let data;
  try { data = await getAwardAdmin({ id: user.id, role: user.role, name: user.name }, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const { award, summary: s, people, history } = data;
  const manage = can(user.role, "award:manage");
  const cur = award.currency;
  return (
    <div className="space-y-6">
      <p className="text-sm"><Link href="/admin/awards" className="underline">← Awards & payments</Link></p>
      <PageHeader eyebrow="Award record" title={award.reference} description={<>For application <Link className="underline" href={`/admin/applications/${award.application.id}`}>{award.application.reference}</Link> · {award.application.organization?.name ?? award.application.applicant.name}</>}
        actions={award.application.opportunity.classification === "DEMO" ? <DemoBadge /> : undefined} />
      {sp.created ? <Alert tone="ok" title="Award record created">The application is now in “Award processing”. Next, schedule instalments below. No payment has been made.</Alert> : null}
      <Alert tone="warn" title="Fictional test data / manual records">Amounts here are administrative records. Nothing is paid by this site and no status is verified by a payment provider.</Alert>

      <Card><CardHeader title="Summary" /><CardBody className="space-y-4">
        <DefinitionList items={[
          { label: "Approved amount", value: <strong>{formatMinor(award.amountMinor, cur)}</strong> }, { label: "Status", value: <Badge tone={award.status === "ACTIVE" ? "ok" : "warn"}>{award.status.replace("_", " ")}</Badge> },
          { label: "Acceptance", value: award.acceptanceStatus.replace("_", " ").toLowerCase() }, { label: "Approved by / on", value: `${people[award.approvedById] ?? "Staff"} · ${formatDate(award.approvedAt)}` },
          { label: "Scheduled (planned, excl. cancelled/failed)", value: formatMinor(s.scheduledMinor, cur) }, { label: "Recorded as paid (manual, unverified)", value: formatMinor(s.paidRecordedMinor, cur) },
          { label: "Unscheduled balance", value: s.unscheduledMinor > 0 ? <span className="font-semibold text-warn-700">{formatMinor(s.unscheduledMinor, cur)} — schedule is incomplete</span> : "None — fully scheduled" },
          { label: "Outstanding (not yet recorded as paid)", value: formatMinor(s.outstandingMinor, cur) },
        ]} />
        {award.conditions ? <p className="text-sm"><strong>Conditions:</strong> {award.conditions}</p> : null}
        {award.applicantSummary ? <p className="text-sm"><strong>Applicant-visible summary:</strong> {award.applicantSummary}</p> : null}
        {award.internalNotes ? <p className="rounded-lg bg-warn-50 p-3 text-sm"><strong>Internal notes:</strong> {award.internalNotes}</p> : null}
      </CardBody></Card>

      <Card><CardHeader title="Instalment schedule" /><CardBody className="space-y-5">
        {award.disbursements.length === 0 ? <p className="text-sm text-ink-600">No instalments scheduled yet.</p> : (
          <ul className="space-y-4">{award.disbursements.map((d) => {
            const allowed = DISBURSEMENT_TRANSITIONS[d.status as DisbursementStatus] ?? [];
            const locked = LOCKED_FOR_EDIT.includes(d.status as DisbursementStatus);
            const overdue = isOverdue(d);
            return (
              <li key={d.id} className="rounded-xl border border-ink-200 p-4">
                <div className="flex flex-wrap items-center gap-3"><strong>{d.reference}</strong><DisbursementBadge status={d.status} />{overdue ? <Badge tone="bad">Overdue</Badge> : null}<span className="text-sm text-ink-700">{formatMinor(d.amountMinor, d.currency)} · planned {formatDate(d.plannedDate)}{d.milestone ? ` · ${d.milestone}` : ""}</span></div>
                {d.status === "PAID_MANUAL" || d.status === "RECONCILED" || d.status === "PROCESSING_RECORDED" ? <p className="mt-2 rounded bg-warn-50 p-2 text-xs text-warn-700">Manual record entered by {people[d.events.at(-1)?.actorId ?? ""] ?? "authorized staff"} — not independently verified by a payment provider. Note: {d.manualRecordNote}</p> : null}
                {d.applicantNote ? <p className="mt-2 text-sm"><em>Applicant sees:</em> {d.applicantNote}</p> : null}
                {d.internalNotes ? <p className="mt-1 text-sm text-ink-700"><em>Internal:</em> {d.internalNotes}</p> : null}
                {manage ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <InstalmentStatusForm id={d.id} awardId={award.id} status={d.status} allowed={allowed} />
                    {locked ? <p className="text-xs text-ink-600">Amount and date are locked once recorded as paid, reconciled or cancelled.</p>
                      : <details><summary className="cursor-pointer text-sm font-semibold text-navy-800">Edit amount / date / notes</summary><div className="mt-2"><InstalmentEditForm d={{ id: d.id, awardId: award.id, amount: minorToInputValue(d.amountMinor, d.currency), plannedDate: dateInputValue(d.plannedDate), milestone: d.milestone, applicantNote: d.applicantNote, internalNotes: d.internalNotes }} /></div></details>}
                  </div>) : null}
                <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-ink-700">History ({d.events.length})</summary>
                  <ol className="mt-2 space-y-1 text-xs text-ink-700">{d.events.map((e) => <li key={e.id}>{formatDateTime(e.createdAt)} · {people[e.actorId] ?? "Staff"} · {e.fromStatus ?? "—"} → {e.toStatus}{e.reason ? ` — ${e.reason}` : ""}</li>)}</ol></details>
              </li>);
          })}</ul>
        )}
        {manage && award.status !== "CANCELLED" ? <div className="border-t border-ink-100 pt-4"><h3 className="mb-2 font-sans text-base font-bold tracking-normal">Schedule a new instalment</h3><AddInstalmentForm awardId={award.id} currency={cur} remaining={formatMinor(Math.max(0, s.unscheduledMinor), cur)} /></div> : null}
      </CardBody></Card>

      {manage ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader title="Edit award details" /><CardBody><AwardEditForm award={award} /></CardBody></Card>
          <Card><CardHeader title="Change approved amount" description="Audited with the previous value." /><CardBody><AmountForm awardId={award.id} current={minorToInputValue(award.amountMinor, cur)} /></CardBody></Card>
        </div>
      ) : null}

      <Card><CardHeader title="Award & disbursement audit history" description="Append-only." /><CardBody>
        {history.length === 0 ? <p className="text-sm text-ink-600">No entries.</p> : <ul className="space-y-2 text-sm">{history.map((h) => (
          <li key={h.id} className="rounded-lg bg-ink-50 p-3"><p><strong>{h.action}</strong> · {h.actorName} · {formatDateTime(h.createdAt)}</p><p>{h.summary}</p>{h.reason ? <p className="text-ink-700">Reason: {h.reason}</p> : null}{h.before || h.after ? <p className="break-all text-xs text-ink-600">{h.before ? `before ${h.before}` : ""} {h.after ? `→ after ${h.after}` : ""}</p> : null}</li>))}</ul>}
      </CardBody></Card>
    </div>
  );
}
