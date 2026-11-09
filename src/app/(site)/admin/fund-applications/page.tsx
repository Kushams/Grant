import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listFundApplicationsStaff } from "@/lib/services/fund-applications";
import { APPLICANT_TYPE_LABELS, FUND_APPLICATION_STATUSES, FUND_APPLICATION_STATUS_LABELS, type ApplicantType, type FundApplicationStatus } from "@/lib/constants";
import { formatMinor } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { formatDate, qs } from "@/lib/format";

export const metadata: Metadata = { title: "Fund applications" };

const statusTone = (s: string) => (s === "RECEIVED" ? "warn" : s === "IN_REVIEW" ? "info" : s === "APPROVED" ? "ok" : "navy") as "warn" | "info" | "ok" | "navy";

export default async function FundApplicationsInbox({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const user = await requirePermission("support:manage", "/admin/fund-applications");
  const sp = await searchParams;
  const status = (FUND_APPLICATION_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const res = await listFundApplicationsStaff({ id: user.id, role: user.role, name: user.name }, { q: sp.q?.trim() || undefined, status, page: Math.max(1, Number(sp.page) || 1) });
  return (
    <div>
      <PageHeader title="Fund applications" description="Applications from the public short form on the General Opportunity Fund page. Applicants have no account — contact them about the outcome only, using the details they supplied." />
      <form method="get" className="mb-4 grid gap-4 rounded-xl border border-ink-200 bg-white p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <TextField label="Search" name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Reference, name, email, country" />
        <SelectField label="Status" name="status" defaultValue={status ?? ""} placeholder="All" options={FUND_APPLICATION_STATUSES.map((s) => ({ value: s, label: FUND_APPLICATION_STATUS_LABELS[s] }))} />
        <div className="flex gap-2"><Button type="submit">Filter</Button>{sp.q || status ? <Link href="/admin/fund-applications" className={buttonClasses("outline")}>Clear</Link> : null}</div>
      </form>
      {res.rows.length === 0 ? <EmptyState title="No fund applications match" /> : (
        <>
          <TableWrap label="Fund applications"><Table>
            <thead><tr><Th>Reference</Th><Th>Applicant</Th><Th>Type</Th><Th>Country</Th><Th>Requested</Th><Th>Received</Th><Th>Status</Th></tr></thead>
            <tbody>{res.rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap font-semibold"><Link className="text-navy-800 underline" href={`/admin/fund-applications/${r.id}`}>{r.reference}</Link></Td>
                <Td>{r.fullName}<span className="block text-xs text-ink-600">{r.email}</span></Td>
                <Td>{APPLICANT_TYPE_LABELS[r.applicantType as ApplicantType] ?? r.applicantType}</Td>
                <Td>{r.country}</Td>
                <Td className="whitespace-nowrap">{formatMinor(r.amountMinor, r.currency)}</Td>
                <Td className="whitespace-nowrap">{formatDate(r.createdAt)}</Td>
                <Td><Badge tone={statusTone(r.status)}>{FUND_APPLICATION_STATUS_LABELS[r.status as FundApplicationStatus] ?? r.status}</Badge></Td>
              </tr>))}</tbody>
          </Table></TableWrap>
          <Pagination page={res.page} pages={res.pages} hrefFor={(n) => `/admin/fund-applications${qs({ q: sp.q, status, page: n })}`} />
        </>
      )}
    </div>
  );
}
