import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getApplicationStaff } from "@/lib/services/applications";
import { listReviewers } from "@/lib/services/users";
import { NotFoundError, can } from "@/lib/permissions";
import { allowedTargets, actorKindFor } from "@/lib/status";
import { APPLICANT_TYPE_LABELS, STATUS_LABELS, type ApplicantType, type ApplicationStatus } from "@/lib/constants";
import { assignAction, decideAction, moveStatusAction, noteAction, recommendAction, requestInfoAction, requestRevisionAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextArea } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, DefinitionList, PageHeader } from "@/components/ui/misc";
import { Badge, DemoBadge, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatMinor } from "@/lib/money";
import { fundingLabel } from "@/lib/opportunity-display";

export const metadata: Metadata = { title: "Review application" };

const show = (v: string) => { if (v.startsWith("[")) { try { return (JSON.parse(v) as string[]).join(", "); } catch { return v; } } return v === "YES" ? "Yes" : v === "NO" ? "No" : v; };

export default async function StaffApplication({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission("application:review", `/admin/applications/${id}`);
  const actor = { id: user.id, role: user.role, name: user.name };
  let data;
  try { data = await getApplicationStaff(actor, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const { app, opp, authors } = data;
  const status = app.status as ApplicationStatus;
  const kind = actorKindFor(user.role);
  const targets = allowedTargets(status, kind);
  const isAdmin = can(user.role, "application:decide");
  const reviewers = can(user.role, "application:assign") ? await listReviewers() : [];
  const currentReviewer = app.assignments.find((a) => a.isActive);
  const sections = [["GENERAL", "Programme questions"], ["PROJECT", "Project or purpose"], ["SUPPORTING", "Supporting information"]] as const;
  const who = app.organization ? `${app.organization.name} (${APPLICANT_TYPE_LABELS[app.applicantCategory as ApplicantType] ?? app.applicantCategory})` : `${app.applicant.individual?.fullName ?? app.applicant.name} (${APPLICANT_TYPE_LABELS[app.applicantCategory as ApplicantType] ?? app.applicantCategory})`;
  const decline = isAdmin && targets.includes("DECLINED");
  const approve = isAdmin && targets.includes("APPROVED");
  const canMove = (["INITIAL_REVIEW", "UNDER_REVIEW"] as ApplicationStatus[]).some((t) => targets.includes(t));
  const hasStatusControls = canMove || targets.includes("INFO_REQUESTED") || targets.includes("RESUBMISSION_REQUIRED");

  return (
    <div className="space-y-6">
      <p className="text-sm"><Link href="/admin/applications" className="underline">← Review queue</Link></p>
      <PageHeader eyebrow="Application" title={app.reference ?? "—"} description={<>{opp.title} · {who}</>} actions={<><StatusBadge status={app.status} />{opp.isDemo ? <DemoBadge compact /> : null}</>} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardHeader title="Summary" /><CardBody>
            <DefinitionList items={[
              { label: "Opportunity", value: `${opp.title} (${opp.reference})` }, { label: "Funding", value: fundingLabel(opp) ?? "To be confirmed" },
              { label: "Submitted", value: formatDateTime(app.submittedAt) }, { label: "Decision date", value: app.decidedAt ? formatDate(app.decidedAt) : "—" },
              { label: "Requested amount", value: app.requestedAmountMinor != null ? formatMinor(app.requestedAmountMinor, opp.currency) : "—" },
              { label: "Assigned reviewer", value: currentReviewer?.reviewer.name ?? "Unassigned" },
              { label: "Applicant location", value: app.organization ? [app.organization.city, app.organization.country].filter(Boolean).join(", ") || "—" : [app.applicant.individual?.city, app.applicant.individual?.country].filter(Boolean).join(", ") || "—" },
            ]} />
            <p className="mt-3 text-xs text-ink-600">Contact details and other unnecessary personal data are intentionally not shown in the review view.</p>
          </CardBody></Card>

          {sections.map(([key, title]) => {
            const rows = app.answers.filter((a) => a.section === key);
            if (!rows.length) return null;
            return (
              <Card key={key}><CardHeader title={title} /><CardBody><dl className="space-y-4">{rows.map((a) => (
                <div key={a.id}><dt className="text-sm font-semibold text-ink-900">{a.questionLabel}</dt><dd className="mt-0.5 whitespace-pre-line text-sm text-ink-700">{show(a.value)}</dd></div>))}</dl></CardBody></Card>
            );
          })}

          <Card><CardHeader title="Internal notes & recommendations" description="Confidential — never shown to applicants." /><CardBody>
            {app.notes.length === 0 ? <p className="text-sm text-ink-600">No internal notes yet.</p> : <ul className="space-y-3">{app.notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-warn-50 p-3 text-sm"><p className="text-xs font-bold uppercase text-ink-700">{n.kind === "RECOMMENDATION" ? `Recommendation: ${n.recommendation}` : "Note"} · {authors[n.authorId] ?? "Staff"} · {formatDateTime(n.createdAt)}</p><p className="mt-1 whitespace-pre-line">{n.body}</p></li>))}</ul>}
          </CardBody></Card>

          <Card><CardHeader title="Applicant-visible messages" /><CardBody>
            {app.messages.length === 0 ? <p className="text-sm text-ink-600">No messages.</p> : <ul className="space-y-3">{app.messages.map((m) => (
              <li key={m.id} className="rounded-lg bg-sand-100 p-3 text-sm"><p className="text-xs font-bold uppercase text-ink-700">{m.kind.replace("_", " ")} · {m.authorRole} · {formatDateTime(m.createdAt)}</p><p className="mt-1 whitespace-pre-line">{m.body}</p></li>))}</ul>}
          </CardBody></Card>

          <Card><CardHeader title="Decision records" /><CardBody>
            {app.decisions.length === 0 ? <p className="text-sm text-ink-600">No recommendation or decision recorded.</p> : <ul className="space-y-3">{app.decisions.map((d) => (
              <li key={d.id} className="rounded-lg border border-ink-200 p-3 text-sm"><p><Badge tone={d.kind === "FINAL" ? "navy" : "teal"}>{d.kind === "FINAL" ? "Final decision" : "Recommendation"}</Badge> <strong className="ml-1">{d.outcome}</strong> · {authors[d.decidedById] ?? "Staff"} · {formatDateTime(d.decidedAt)}</p><p className="mt-1"><strong>Reason:</strong> {d.reason}</p>{d.internalNotes ? <p><strong>Internal notes:</strong> {d.internalNotes}</p> : null}{d.applicantMessage ? <p><strong>Applicant message:</strong> {d.applicantMessage}</p> : null}</li>))}</ul>}
          </CardBody></Card>

          <Card><CardHeader title="Status history & assignments" /><CardBody className="space-y-4">
            <ol className="space-y-3 border-l-2 border-ink-200 pl-4">{app.events.map((e) => (
              <li key={e.id} className="text-sm"><StatusBadge status={e.toStatus} /> <span className="text-xs text-ink-600">{formatDateTime(e.createdAt)} · {e.actorId ? authors[e.actorId] ?? e.actorRole : "System"} ({e.actorRole})</span>
                {e.internalNote ? <p className="mt-1 text-ink-700"><em>Internal:</em> {e.internalNote}</p> : null}{e.publicNote ? <p className="text-ink-700"><em>Shown to applicant:</em> {e.publicNote}</p> : null}</li>))}</ol>
            <div><h3 className="mb-1 font-sans text-sm font-bold tracking-normal">Assignment history</h3>
              {app.assignments.length === 0 ? <p className="text-sm text-ink-600">Never assigned.</p> : <ul className="space-y-1 text-sm">{app.assignments.map((a) => <li key={a.id}>{a.reviewer.name} — {formatDate(a.createdAt)}{a.endedAt ? ` → ${formatDate(a.endedAt)}` : " (current)"}</li>)}</ul>}</div>
          </CardBody></Card>
        </div>

        <aside className="space-y-6" aria-label="Review actions">
          {app.award ? (
            <Card><CardHeader title="Award" /><CardBody className="text-sm">
              <p><strong>{app.award.reference}</strong> · {formatMinor(app.award.amountMinor, app.award.currency)}</p>
              {can(user.role, "award:view") ? <Link className="mt-2 inline-block font-semibold text-navy-800 underline" href={`/admin/awards/${app.award.id}`}>Manage award & instalments</Link> : <p className="mt-1 text-ink-600">Award administration is limited to administrators.</p>}
            </CardBody></Card>
          ) : status === "APPROVED" && can(user.role, "award:manage") ? (
            <Alert tone="info" title="Approved — no award record yet"><Link className="font-semibold underline" href={`/admin/awards?create=${app.id}`}>Create the award record</Link></Alert>
          ) : null}

          {can(user.role, "application:assign") ? (
            <Card><CardHeader title="Reviewer assignment" /><CardBody>
              <ActionForm action={assignAction} hidden={{ applicationId: app.id }} submitLabel={currentReviewer ? "Reassign" : "Assign"}>
                <SelectField label="Reviewer" name="reviewerId" defaultValue={currentReviewer?.reviewerId ?? ""} placeholder="Choose…" options={reviewers.map((r) => ({ value: r.id, label: `${r.name}${r.role === "ADMIN" ? " (admin)" : ""}` }))} />
              </ActionForm>
            </CardBody></Card>
          ) : null}

          <Card><CardHeader title="Status" description={`Currently: ${STATUS_LABELS[status]}`} /><CardBody className="space-y-5">
            {(["INITIAL_REVIEW", "UNDER_REVIEW"] as ApplicationStatus[]).filter((t) => targets.includes(t)).length ? (
              <ActionForm action={moveStatusAction} hidden={{ applicationId: app.id }} submitLabel="Move" variant="secondary">
                <SelectField label="Move to" name="to" options={(["INITIAL_REVIEW", "UNDER_REVIEW"] as ApplicationStatus[]).filter((t) => targets.includes(t)).map((t) => ({ value: t, label: STATUS_LABELS[t] }))} />
                <TextArea label="Internal note (optional)" name="note" rows={2} />
              </ActionForm>
            ) : null}
            {targets.includes("INFO_REQUESTED") ? (
              <ActionForm action={requestInfoAction} hidden={{ applicationId: app.id }} submitLabel="Request information" variant="outline">
                <TextArea label="Request additional information" name="message" required rows={3} hint="Shown to the applicant. Status becomes “Additional information requested”." />
              </ActionForm>
            ) : null}
            {targets.includes("RESUBMISSION_REQUIRED") ? (
              <ActionForm action={requestRevisionAction} hidden={{ applicationId: app.id }} submitLabel="Request revision" variant="outline">
                <TextArea label="Request a revision" name="message" required rows={3} hint="Unlocks editing for the applicant. Reason is recorded on the timeline." />
              </ActionForm>
            ) : null}
            {!hasStatusControls ? <p className="text-sm text-ink-600">No manual review actions apply in this state. Later stages (decision, award, disbursement) are handled in their own sections.</p> : null}
          </CardBody></Card>

          <Card><CardHeader title="Add internal note" /><CardBody>
            <ActionForm action={noteAction} hidden={{ applicationId: app.id }} submitLabel="Save note"><TextArea label="Note (internal only)" name="body" required rows={3} /></ActionForm>
          </CardBody></Card>

          {status === "UNDER_REVIEW" ? (
            <Card><CardHeader title="Recommendation" description="A recommendation is not a decision." /><CardBody>
              <ActionForm action={recommendAction} hidden={{ applicationId: app.id }} submitLabel="Record recommendation" variant="accent">
                <SelectField label="Recommend" name="recommendation" placeholder="Choose…" options={[{ value: "APPROVE", label: "Approve" }, { value: "DECLINE", label: "Decline" }]} />
                <TextArea label="Rationale" name="body" required rows={3} />
              </ActionForm>
            </CardBody></Card>
          ) : null}

          {(approve || decline) ? (
            <Card className="border-navy-300"><CardHeader title="Final decision" description="Administrators only. Approval requires a prior recommendation." /><CardBody>
              <ActionForm action={decideAction} hidden={{ applicationId: app.id }} submitLabel="Record final decision" variant="primary">
                <SelectField label="Outcome" name="outcome" placeholder="Choose…" options={[...(approve ? [{ value: "APPROVE", label: "Approve" }] : []), ...(decline ? [{ value: "DECLINE", label: "Decline" }] : [])]} />
                <TextArea label="Reason (internal, recorded)" name="reason" required rows={2} />
                <TextArea label="Internal notes (optional)" name="internalNotes" rows={2} />
                <TextArea label="Message shown to the applicant (optional)" name="applicantMessage" rows={3} />
              </ActionForm>
            </CardBody></Card>
          ) : null}

          {isAdmin && targets.includes("CLOSED") ? (
            <Card><CardHeader title="Close file" /><CardBody>
              <ActionForm action={moveStatusAction} hidden={{ applicationId: app.id, to: "CLOSED" }} submitLabel="Close application" variant="outline"><TextArea label="Reason" name="note" rows={2} /></ActionForm>
            </CardBody></Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
