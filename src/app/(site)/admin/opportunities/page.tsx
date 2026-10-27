import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listOpportunitiesAdmin } from "@/lib/services/opportunities";
import { OPPORTUNITY_STATUSES } from "@/lib/constants";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Button, LinkButton, buttonClasses } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { formatDate, qs } from "@/lib/format";
import { fundingLabel } from "@/lib/opportunity-display";

export const metadata: Metadata = { title: "Manage opportunities" };

export default async function AdminOpportunities({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; classification?: string; page?: string }> }) {
  await requirePermission("opportunity:manage", "/admin/opportunities");
  const sp = await searchParams;
  const status = (OPPORTUNITY_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const classification = sp.classification === "DEMO" || sp.classification === "LIVE" ? sp.classification : undefined;
  const res = await listOpportunitiesAdmin({ q: sp.q?.trim() || undefined, status, classification, page: Math.max(1, Number(sp.page) || 1) });
  return (
    <div>
      <PageHeader title="Opportunities" description="Create, edit, publish, unpublish and archive. Archiving never deletes historical applications or awards." actions={<LinkButton href="/admin/opportunities/new">New opportunity</LinkButton>} />
      <form method="get" className="mb-4 grid gap-4 rounded-xl border border-ink-200 bg-surface p-4 sm:grid-cols-[1fr_11rem_11rem_auto] sm:items-end">
        <TextField label="Search" name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Title or reference" />
        <SelectField label="Status" name="status" defaultValue={status ?? ""} placeholder="All" options={OPPORTUNITY_STATUSES.map((s) => ({ value: s, label: s.toLowerCase() }))} />
        <SelectField label="Demo / live" name="classification" defaultValue={classification ?? ""} placeholder="All" options={[{ value: "DEMO", label: "Demo" }, { value: "LIVE", label: "Live" }]} />
        <div className="flex gap-2"><Button type="submit">Filter</Button>{sp.q || status || classification ? <Link href="/admin/opportunities" className={buttonClasses("outline")}>Clear</Link> : null}</div>
      </form>
      {res.rows.length === 0 ? <EmptyState title="No opportunities match" /> : (
        <>
          <TableWrap label="Opportunities"><Table className="min-w-[52rem]">
            <thead><tr><Th>Opportunity</Th><Th>Status</Th><Th>Funding</Th><Th>Deadline</Th><Th>Applications</Th><Th>Updated</Th></tr></thead>
            <tbody>{res.rows.map((o) => (
              <tr key={o.id}>
                <Td className="min-w-64"><Link href={`/admin/opportunities/${o.id}`} className="font-semibold text-violet-300 underline">{o.title}</Link><span className="block text-xs text-ink-600">{o.reference}</span>{o.isDemo ? <DemoBadge compact className="mt-1" /> : <Badge tone={o.verifiedAt ? "ok" : "warn"} className="mt-1">{o.verifiedAt ? "LIVE · verified" : "LIVE · unverified"}</Badge>}</Td>
                <Td><Badge tone={o.status === "PUBLISHED" ? "ok" : o.status === "ARCHIVED" ? "neutral" : "warn"}>{o.status.toLowerCase()}</Badge></Td>
                <Td>{fundingLabel(o) ?? "To be confirmed"}</Td><Td className="whitespace-nowrap">{o.deadline ? formatDate(o.deadline) : "TBC"}</Td>
                <Td>{o.applicationCount}</Td><Td className="whitespace-nowrap">{formatDate(o.updatedAt)}</Td>
              </tr>))}</tbody>
          </Table></TableWrap>
          <Pagination page={res.page} pages={res.pages} hrefFor={(n) => `/admin/opportunities${qs({ q: sp.q, status, classification, page: n })}`} />
        </>
      )}
    </div>
  );
}
