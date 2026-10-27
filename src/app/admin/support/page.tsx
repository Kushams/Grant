import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listSupportStaff } from "@/lib/services/support";
import { SUPPORT_STATUSES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { formatDate, qs } from "@/lib/format";

export const metadata: Metadata = { title: "Support inbox" };

export default async function SupportInbox({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const user = await requirePermission("support:manage", "/admin/support");
  const sp = await searchParams;
  const status = (SUPPORT_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const res = await listSupportStaff({ id: user.id, role: user.role, name: user.name }, { q: sp.q?.trim() || undefined, status, page: Math.max(1, Number(sp.page) || 1) });
  return (
    <div>
      <PageHeader title="Support inbox" description="Requests from the contact form. Replies are in-app only — nothing is emailed." />
      <form method="get" className="mb-4 grid gap-4 rounded-xl border border-ink-200 bg-white p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <TextField label="Search" name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Reference, name, topic" />
        <SelectField label="Status" name="status" defaultValue={status ?? ""} placeholder="All" options={SUPPORT_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }))} />
        <div className="flex gap-2"><Button type="submit">Filter</Button>{sp.q || status ? <Link href="/admin/support" className={buttonClasses("outline")}>Clear</Link> : null}</div>
      </form>
      {res.rows.length === 0 ? <EmptyState title="No support requests match" /> : (
        <>
          <TableWrap label="Support requests"><Table>
            <thead><tr><Th>Reference</Th><Th>Topic</Th><Th>Sender</Th><Th>Related</Th><Th>Received</Th><Th>Status</Th><Th>Assigned</Th></tr></thead>
            <tbody>{res.rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap font-semibold"><Link className="text-navy-800 underline" href={`/admin/support/${r.id}`}>{r.reference}</Link></Td>
                <Td>{r.topic}</Td><Td>{r.name}{r.userId ? <span className="block text-xs text-ink-600">signed-in user</span> : <span className="block text-xs text-ink-600">visitor</span>}</Td>
                <Td>{r.relatedRef ?? "—"}</Td><Td className="whitespace-nowrap">{formatDate(r.createdAt)}</Td>
                <Td><Badge tone={r.status === "OPEN" ? "warn" : r.status === "IN_PROGRESS" ? "info" : "ok"}>{r.status.replace("_", " ")}</Badge></Td>
                <Td>{r.assignedName ?? "—"}</Td>
              </tr>))}</tbody>
          </Table></TableWrap>
          <Pagination page={res.page} pages={res.pages} hrefFor={(n) => `/admin/support${qs({ q: sp.q, status, page: n })}`} />
        </>
      )}
    </div>
  );
}
