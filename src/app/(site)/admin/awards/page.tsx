import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { approvedWithoutAward, listAwards } from "@/lib/services/awards";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { AWARD_STATUSES, DISBURSEMENT_LABELS, DISBURSEMENT_STATUSES } from "@/lib/constants";
import { formatMinor, minorToInputValue } from "@/lib/money";
import { CreateAwardForm } from "@/components/admin/award-forms";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/form";
import { Alert, EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { formatDate, qs } from "@/lib/format";

export const metadata: Metadata = { title: "Awards and payments" };

type SP = { q?: string; awardStatus?: string; disbursementStatus?: string; opportunityId?: string; mode?: string; from?: string; to?: string; page?: string; create?: string };

export default async function AwardsAdmin({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requirePermission("award:view", "/admin/awards");
  const actor = { id: user.id, role: user.role, name: user.name };
  const sp = await searchParams;
  const ok = (v: string | undefined, list: readonly string[]) => (v && list.includes(v) ? v : undefined);
  const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const f = { q: sp.q?.trim() || undefined, awardStatus: ok(sp.awardStatus, AWARD_STATUSES), disbursementStatus: ok(sp.disbursementStatus, DISBURSEMENT_STATUSES), opportunityId: sp.opportunityId || undefined, mode: ok(sp.mode, ["INDIVIDUAL", "ORGANIZATION"]), from: date(sp.from), to: date(sp.to) };
  const [res, pending, opps] = await Promise.all([
    listAwards(actor, { ...f, page: Math.max(1, Number(sp.page) || 1) }),
    approvedWithoutAward(actor),
    db.opportunity.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  const canManage = can(user.role, "award:manage");
  const filtered = Object.values(f).some(Boolean);
  const options = pending.map((a) => ({
    id: a.id, label: `${a.reference} — ${a.opportunity.title}`, currency: a.opportunity.currency,
    fixed: a.opportunity.fundingSpecified && a.opportunity.fixedAmountMinor != null ? minorToInputValue(a.opportunity.fixedAmountMinor, a.opportunity.currency) : "",
  }));
  return (
    <div className="space-y-8">
      <PageHeader title="Awards & payments" description="Administrative records of approved awards and planned/recorded disbursements. This system never moves money." />
      <Alert tone="warn" title="Records, not payments">“Paid — manually recorded” means an authorized staff member entered that status. It is not verified by a payment provider. Actual payments need a separately approved, secure financial process.</Alert>

      {canManage ? (
        <Card><CardHeader title="Create an award" description={`${pending.length} approved application${pending.length === 1 ? "" : "s"} without an award record`} /><CardBody>
          {pending.length === 0 ? <p className="text-sm text-ink-600">There are no approved applications waiting for an award record.</p> : <CreateAwardForm options={options} preselect={sp.create} />}
        </CardBody></Card>
      ) : null}

      <form method="get" className="grid gap-4 rounded-xl border border-ink-200 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter awards">
        <TextField label="Search by award, application or instalment ref" name="q" type="search" defaultValue={f.q ?? ""} />
        <SelectField label="Award status" name="awardStatus" defaultValue={f.awardStatus ?? ""} placeholder="Any" options={AWARD_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ").toLowerCase() }))} />
        <SelectField label="Instalment status" name="disbursementStatus" defaultValue={f.disbursementStatus ?? ""} placeholder="Any" options={DISBURSEMENT_STATUSES.map((s) => ({ value: s, label: DISBURSEMENT_LABELS[s] }))} />
        <SelectField label="Programme" name="opportunityId" defaultValue={f.opportunityId ?? ""} placeholder="Any" options={opps.map((o) => ({ value: o.id, label: o.title }))} />
        <SelectField label="Applicant type" name="mode" defaultValue={f.mode ?? ""} placeholder="Any" options={[{ value: "INDIVIDUAL", label: "Individual" }, { value: "ORGANIZATION", label: "Organization" }]} />
        <TextField label="Approved from" name="from" type="date" defaultValue={f.from ?? ""} />
        <TextField label="Approved to" name="to" type="date" defaultValue={f.to ?? ""} />
        <div className="flex items-end gap-2"><Button type="submit">Filter</Button>{filtered ? <Link href="/admin/awards" className={buttonClasses("outline")}>Clear</Link> : null}</div>
      </form>

      {res.rows.length === 0 ? <EmptyState title={filtered ? "No awards match those filters" : "No award records yet"} /> : (
        <>
          <TableWrap label="Award records"><Table className="min-w-[60rem]">
            <thead><tr><Th>Award</Th><Th>Applicant / programme</Th><Th>Approved</Th><Th>Scheduled</Th><Th>Recorded paid</Th><Th>Unscheduled</Th><Th>Flags</Th></tr></thead>
            <tbody>{res.rows.map((a) => {
              const s = a.summary;
              return (
                <tr key={a.id}>
                  <Td className="whitespace-nowrap font-semibold"><Link className="text-violet-300 underline" href={`/admin/awards/${a.id}`}>{a.reference}</Link><span className="block text-xs font-normal text-ink-600">{a.application.reference}</span></Td>
                  <Td className="min-w-48">{a.application.organization?.name ?? a.application.applicant.name}<span className="block text-xs text-ink-600">{a.application.opportunity.title}</span>{a.application.opportunity.classification === "DEMO" ? <DemoBadge compact className="mt-1" /> : null}</Td>
                  <Td className="whitespace-nowrap">{formatMinor(a.amountMinor, a.currency)}<span className="block text-xs text-ink-600">{formatDate(a.approvedAt)}</span></Td>
                  <Td className="whitespace-nowrap">{formatMinor(s.scheduledMinor, a.currency)}</Td>
                  <Td className="whitespace-nowrap">{formatMinor(s.paidRecordedMinor, a.currency)}</Td>
                  <Td className="whitespace-nowrap">{s.unscheduledMinor > 0 ? formatMinor(s.unscheduledMinor, a.currency) : "—"}</Td>
                  <Td><div className="flex flex-wrap gap-1">
                    {a.status !== "ACTIVE" ? <Badge tone={a.status === "CANCELLED" ? "bad" : "warn"}>{a.status.replace("_", " ")}</Badge> : null}
                    {s.overdueCount ? <Badge tone="bad">{s.overdueCount} overdue</Badge> : null}{s.onHoldCount ? <Badge tone="warn">{s.onHoldCount} on hold</Badge> : null}
                    {s.cancelledCount ? <Badge>{s.cancelledCount} cancelled</Badge> : null}
                    {s.fullyScheduled && s.paidRecordedMinor === a.amountMinor ? <Badge tone="ok">Complete</Badge> : null}
                  </div></Td>
                </tr>);
            })}</tbody>
          </Table></TableWrap>
          <Pagination page={res.page} pages={res.pages} hrefFor={(n) => `/admin/awards${qs({ ...f, page: n })}`} />
        </>
      )}
    </div>
  );
}
