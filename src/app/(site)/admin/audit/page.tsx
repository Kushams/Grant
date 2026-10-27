import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { listAudit } from "@/lib/services/audit";
import { Alert, EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextField } from "@/components/ui/form";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, qs } from "@/lib/format";
import Link from "next/link";

export const metadata: Metadata = { title: "Audit log" };

const GROUPS = [["", "All"], ["opportunity", "Opportunities"], ["application", "Applications"], ["award", "Awards"], ["disbursement", "Disbursements"], ["user", "Users & roles"], ["export", "Exports"], ["support", "Support"]];

function Json({ v }: { v: string | null }) {
  if (!v) return <span className="text-ink-500">—</span>;
  return <code className="block max-w-64 overflow-x-auto whitespace-pre-wrap break-words rounded bg-ink-50 px-1.5 py-1 text-xs">{v}</code>;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; page?: string }> }) {
  await requirePermission("audit:view", "/admin/audit");
  const sp = await searchParams;
  const res = await listAudit({ q: sp.q?.trim() || undefined, action: sp.action || undefined, page: Math.max(1, Number(sp.page) || 1) });
  return (
    <div>
      <PageHeader title="Audit log" description="Append-only record of sensitive actions. There is no control to edit or erase entries; the database also rejects updates and deletes." />
      <Alert tone="info" className="mb-4">Entries store previous and new values and the reason given. Secrets, password hashes and session tokens are never recorded.</Alert>
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink-200 bg-surface p-4">
        <div className="min-w-60 flex-1"><TextField label="Search" name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Summary, entity id or person" /></div>
        <div><label htmlFor="act" className="mb-1.5 block text-sm font-semibold">Category</label>
          <select id="act" name="action" defaultValue={sp.action ?? ""} className="block rounded-lg border border-ink-300 bg-surface px-3 py-2.5">{GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <Button type="submit">Filter</Button>{sp.q || sp.action ? <Link className={buttonClasses("outline")} href="/admin/audit">Clear</Link> : null}
      </form>
      {res.rows.length === 0 ? <EmptyState title="No matching audit entries" /> : (
        <>
          <p className="mb-2 text-sm text-ink-600">{res.total} entries</p>
          <TableWrap label="Audit log entries"><Table className="min-w-[60rem]">
            <thead><tr><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Summary</Th><Th>Before</Th><Th>After</Th><Th>Reason</Th></tr></thead>
            <tbody>{res.rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{formatDateTime(r.createdAt)}</Td>
                <Td className="whitespace-nowrap">{r.actorName}<span className="block text-xs text-ink-600">{r.actorRole}</span></Td>
                <Td><Badge tone="navy">{r.action}</Badge></Td>
                <Td className="min-w-56">{r.summary}</Td>
                <Td><Json v={r.before} /></Td><Td><Json v={r.after} /></Td>
                <Td className="min-w-40">{r.reason ?? "—"}</Td>
              </tr>))}</tbody>
          </Table></TableWrap>
          <Pagination page={res.page} pages={res.pages} hrefFor={(n) => `/admin/audit${qs({ q: sp.q, action: sp.action, page: n })}`} />
        </>
      )}
    </div>
  );
}
