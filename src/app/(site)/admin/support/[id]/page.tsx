import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getSupportStaff } from "@/lib/services/support";
import { listReviewers } from "@/lib/services/users";
import { NotFoundError } from "@/lib/permissions";
import { supportNoteAction, supportStatusAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextArea } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, DefinitionList, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { SUPPORT_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

export const metadata: Metadata = { title: "Support request" };

export default async function SupportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission("support:manage", `/admin/support/${id}`);
  let data;
  try { data = await getSupportStaff({ id: user.id, role: user.role, name: user.name }, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const { req, authors } = data;
  const staff = await listReviewers();
  return (
    <div className="space-y-6">
      <p className="text-sm"><Link href="/admin/support" className="underline">← Support inbox</Link></p>
      <PageHeader title={req.reference} description={req.topic} />
      <Card><CardBody className="space-y-4">
        <DefinitionList items={[
          { label: "From", value: `${req.name}` }, { label: "Account", value: req.userId ? "Signed-in user (replies visible in their dashboard)" : "Visitor (no account — public replies cannot be delivered)" },
          { label: "Related reference", value: req.relatedRef ?? "None" }, { label: "Received", value: formatDateTime(req.createdAt) },
          { label: "Consent to privacy notice", value: formatDateTime(req.consentAt) }, { label: "Status", value: <Badge tone="info">{req.status.replace("_", " ")}</Badge> },
        ]} />
        <blockquote className="whitespace-pre-line rounded-lg bg-sand-100 p-4 text-sm text-ink-900">{req.message}</blockquote>
      </CardBody></Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Status & assignment" /><CardBody>
          <ActionForm action={supportStatusAction} hidden={{ id: req.id }} submitLabel="Update">
            <SelectField label="Status" name="status" defaultValue={req.status} options={SUPPORT_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }))} />
            <SelectField label="Assigned to" name="assignedToId" defaultValue={req.assignedToId ?? ""} placeholder="Unassigned" options={staff.map((s) => ({ value: s.id, label: s.name }))} />
          </ActionForm>
        </CardBody></Card>
        <Card><CardHeader title="Add a note or reply" /><CardBody>
          <ActionForm action={supportNoteAction} hidden={{ id: req.id }} submitLabel="Save">
            <TextArea label="Message" name="body" required rows={3} />
            <SelectField label="Visibility" name="visibility" defaultValue="internal" options={[{ value: "internal", label: "Internal note (hidden from the requester)" }, { value: "public", label: "Public reply (visible in the requester’s dashboard)" }]} />
          </ActionForm>
        </CardBody></Card>
      </div>
      <Card><CardHeader title="Conversation & notes" /><CardBody>
        {req.notes.length === 0 ? <p className="text-sm text-ink-600">No notes yet.</p> : <ul className="space-y-3">{req.notes.map((n) => (
          <li key={n.id} className={`rounded-lg p-3 text-sm ${n.isInternal ? "bg-warn-50" : "bg-teal-50"}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-700">{n.isInternal ? "Internal — hidden from requester" : "Public reply"} · {authors[n.authorId] ?? "Staff"} · {formatDateTime(n.createdAt)}</p>
            <p className="mt-1 whitespace-pre-line">{n.body}</p></li>))}</ul>}
      </CardBody></Card>
      <Alert tone="info">No external email is sent from this screen. Public replies appear only inside the requester’s dashboard.</Alert>
    </div>
  );
}
