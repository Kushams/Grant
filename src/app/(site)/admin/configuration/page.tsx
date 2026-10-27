import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { ORG, UNCONFIRMED_FACTS } from "@/config/organization";
import { db } from "@/lib/db";
import { getLiveReadiness, toView } from "@/lib/services/opportunities";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = { title: "Configuration checklist" };

export default async function Configuration() {
  await requirePermission("opportunity:manage", "/admin/configuration");
  const opps = await db.opportunity.findMany({ where: { status: { not: "ARCHIVED" } }, include: { questions: true }, orderBy: { updatedAt: "desc" } });
  const rows = opps.map((o) => { const v = toView(o); const r = getLiveReadiness(v); return { v, done: r.filter((i) => i.done).length, total: r.length }; });
  return (
    <div className="space-y-8">
      <PageHeader title="Configuration checklist" description="Everything that must be supplied and approved before any real programme or public launch." />
      <Alert tone="warn" title="Nothing here is invented">Organization facts live in <code>src/config/organization.ts</code>. Any value left as <em>null</em> is shown to the public as “to be confirmed”.</Alert>
      <Card><CardHeader title={`${ORG.name} — organization facts`} /><CardBody>
        <ul className="divide-y divide-ink-100">{UNCONFIRMED_FACTS.map((f) => (
          <li key={f.key} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
            <div><p className="font-semibold text-ink-900">{f.label}</p><p className="text-sm text-ink-600">{f.why}</p></div>
            {f.value ? <Badge tone="ok">Configured</Badge> : <Badge tone="warn">To be confirmed</Badge>}
          </li>))}</ul>
      </CardBody></Card>
      <Card><CardHeader title="Opportunity verification readiness" description="A LIVE opportunity needs every item complete plus an explicit verification confirmation. Demo opportunities stay DEMO." /><CardBody>
        <ul className="divide-y divide-ink-100">{rows.map(({ v, done, total }) => (
          <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
            <div><Link className="font-semibold text-navy-800 underline" href={`/admin/opportunities/${v.id}`}>{v.title}</Link><p className="text-xs text-ink-600">{v.reference} · {v.classification}{v.verifiedAt ? " · verified" : ""}</p></div>
            <Badge tone={v.isDemo ? "warn" : done === total ? "ok" : "info"}>{v.isDemo ? "DEMO — never live" : `${done}/${total} items ready`}</Badge>
          </li>))}</ul>
      </CardBody></Card>
    </div>
  );
}
