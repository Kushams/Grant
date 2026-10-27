import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { canPublish, getLiveReadiness, getOpportunityAdmin } from "@/lib/services/opportunities";
import { OpportunityEditor } from "@/components/admin/opportunity-editor";
import { StatusControl, VerifyLiveForm } from "@/components/admin/opportunity-controls";
import { toEditorValues } from "@/lib/opportunity-form";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Edit opportunity" };

export default async function EditOpportunity({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  await requirePermission("opportunity:manage", `/admin/opportunities/${id}`);
  const o = await getOpportunityAdmin(id);
  if (!o) notFound();
  const gate = canPublish(o);
  const readiness = getLiveReadiness(o);
  const missing = readiness.filter((r) => !r.done);
  return (
    <div className="space-y-6">
      <p className="text-sm"><Link href="/admin/opportunities" className="underline">← Opportunities</Link></p>
      <PageHeader eyebrow={o.reference} title={o.title} actions={<>{o.isDemo ? <DemoBadge /> : <Badge tone={o.verifiedAt ? "ok" : "warn"}>{o.verifiedAt ? "LIVE · verified" : "LIVE · unverified"}</Badge>}<Badge tone={o.status === "PUBLISHED" ? "ok" : "warn"}>{o.status.toLowerCase()}</Badge></>} />
      {sp.created ? <Alert tone="ok" title="Opportunity created as a draft">Review the details, then publish when ready.</Alert> : null}

      <Card><CardHeader title="Publication" /><CardBody className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {o.status !== "PUBLISHED" && o.status !== "ARCHIVED" ? <StatusControl id={o.id} to="PUBLISHED" label="Publish" variant="accent" /> : null}
          {o.status === "PUBLISHED" ? <StatusControl id={o.id} to="DRAFT" label="Unpublish" variant="outline" /> : null}
          {o.status === "ARCHIVED" ? <StatusControl id={o.id} to="DRAFT" label="Restore as draft" variant="outline" /> : null}
          {o.status !== "ARCHIVED" ? <StatusControl id={o.id} to="ARCHIVED" label="Archive" variant="danger" /> : null}
        </div>
        {o.status !== "PUBLISHED" && !gate.ok ? <Alert tone="warn" title="Cannot be published yet"><p>{gate.message}</p><ul className="mt-1 list-disc pl-5">{gate.missing.map((m) => <li key={m}>{m}</li>)}</ul></Alert> : null}
        {o.status === "PUBLISHED" && o.isDemo ? <p className="text-sm text-ink-700">Published demo — the DEMO label stays visible on every public page.</p> : null}
        {o.status === "PUBLISHED" ? <p className="text-sm"><Link className="underline" href={`/opportunities/${o.slug}`}>View public page</Link></p> : null}
      </CardBody></Card>

      <Card><CardHeader title="LIVE verification checklist" description={o.isDemo ? "Demo opportunities can be converted to LIVE only by completing every item and recording an explicit verification." : "Everything required for a verified, live programme."} /><CardBody className="space-y-4">
        <ul className="space-y-1.5 text-sm">{readiness.map((r) => <li key={r.key} className="flex gap-2"><span aria-hidden="true">{r.done ? "✅" : "⬜"}</span><span className={r.done ? "text-ink-800" : "text-ink-900 font-semibold"}>{r.label}<span className="sr-only">{r.done ? " — done" : " — still to confirm"}</span></span></li>)}</ul>
        {o.verifiedAt ? <Alert tone="ok" title="Verified">Verified {formatDateTime(o.verifiedAt)}. Note: {o.verificationNote}. Editing material facts voids this verification and unpublishes the opportunity.</Alert>
          : missing.length ? <Alert tone="info">{missing.length} item{missing.length === 1 ? "" : "s"} still to confirm. Saving the form below updates this checklist.</Alert>
          : <VerifyLiveForm id={o.id} />}
      </CardBody></Card>

      <OpportunityEditor v={toEditorValues(o)} />
    </div>
  );
}
