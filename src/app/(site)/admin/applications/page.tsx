import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listApplicationsStaff } from "@/lib/services/applications";
import { listReviewers } from "@/lib/services/users";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";
import { DemoBadge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form";
import { Alert, EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { formatDate, qs } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Application review queue" };

type SP = { q?: string; status?: string; opportunityId?: string; reviewerId?: string; mode?: string; sort?: string; dir?: string; page?: string; unassigned?: string };

export default async function Queue({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requirePermission("application:review", "/admin/applications");
  const sp = await searchParams;
  const isAdmin = can(user.role, "application:viewAll");
  const status = (APPLICATION_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const sort = ["reference", "status", "submitted", "updated"].includes(sp.sort ?? "") ? sp.sort : "updated";
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const mode = sp.mode === "INDIVIDUAL" || sp.mode === "ORGANIZATION" ? sp.mode : undefined;
  const params = { q: sp.q?.trim() || undefined, status, opportunityId: sp.opportunityId || undefined, reviewerId: sp.reviewerId || undefined, mode, sort, dir: dir as "asc" | "desc", unassigned: sp.unassigned === "1", page: Math.max(1, Number(sp.page) || 1) };
  const [res, opps, reviewers] = await Promise.all([
    listApplicationsStaff({ id: user.id, role: user.role, name: user.name }, params),
    db.opportunity.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    isAdmin ? listReviewers() : Promise.resolve([]),
  ]);
  const base = { q: params.q, status, opportunityId: params.opportunityId, reviewerId: params.reviewerId, mode, unassigned: sp.unassigned, sort, dir };
  const sortLink = (key: string, label: string) => {
    const active = sort === key;
    const nextDir = active && dir === "desc" ? "asc" : "desc";
    return <Link href={`/admin/applications${qs({ ...base, sort: key, dir: nextDir })}`} aria-label={`Sort by ${label}${active ? `, currently ${dir === "asc" ? "ascending" : "descending"}` : ""}`} className="underline-offset-2 hover:underline">{label}{active ? (dir === "asc" ? " ▲" : " ▼") : ""}</Link>;
  };
  const filtered = !!(params.q || status || params.opportunityId || params.reviewerId || mode || sp.unassigned);
  return (
    <div>
      <PageHeader title={isAdmin ? "Application review queue" : "My review queue"} description={isAdmin ? "All submitted applications. Drafts are private to applicants." : "Only applications assigned to you are shown."} />
      <form method="get" className="mb-4 grid gap-4 rounded-xl border border-ink-200 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter applications">
        <TextField label="Search" name="q" type="search" defaultValue={params.q ?? ""} placeholder="Reference, applicant, opportunity" />
        <SelectField label="Status" name="status" defaultValue={status ?? ""} placeholder="All statuses" options={APPLICATION_STATUSES.filter((s) => s !== "DRAFT").map((s) => ({ value: s, label: STATUS_LABELS[s as ApplicationStatus] }))} />
        <SelectField label="Opportunity" name="opportunityId" defaultValue={params.opportunityId ?? ""} placeholder="All opportunities" options={opps.map((o) => ({ value: o.id, label: o.title }))} />
        <SelectField label="Applicant type" name="mode" defaultValue={mode ?? ""} placeholder="All" options={[{ value: "INDIVIDUAL", label: "Individual" }, { value: "ORGANIZATION", label: "Organization" }]} />
        {isAdmin ? <SelectField label="Reviewer" name="reviewerId" defaultValue={params.reviewerId ?? ""} placeholder="Any reviewer" options={reviewers.map((r) => ({ value: r.id, label: r.name }))} /> : null}
        {isAdmin ? <div className="flex items-end"><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="unassigned" value="1" defaultChecked={sp.unassigned === "1"} className="size-5 accent-teal-700" />Unassigned only</label></div> : null}
        <input type="hidden" name="sort" value={sort} /><input type="hidden" name="dir" value={dir} />
        <div className="flex items-end gap-2"><Button type="submit">Apply filters</Button>{filtered ? <Link href="/admin/applications" className={buttonClasses("outline")}>Clear</Link> : null}</div>
      </form>
      {!isAdmin ? <Alert tone="info" className="mb-4">Reviewers can only open applications assigned to them. Ask an administrator if something is missing from your queue.</Alert> : null}
      {res.rows.length === 0 ? <EmptyState title={filtered ? "No applications match those filters" : isAdmin ? "No applications have been submitted yet" : "Nothing is assigned to you right now"} /> : (
        <>
          <p className="mb-2 text-sm text-ink-600" aria-live="polite">{res.total} application{res.total === 1 ? "" : "s"}</p>
          <TableWrap label="Application review queue"><Table className="min-w-[56rem]">
            <thead><tr><Th>{sortLink("reference", "Reference")}</Th><Th>Applicant</Th><Th>Opportunity</Th><Th>{sortLink("status", "Status")}</Th><Th>{sortLink("submitted", "Submitted")}</Th><Th>Reviewer</Th><Th>{sortLink("updated", "Updated")}</Th></tr></thead>
            <tbody>{res.rows.map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap font-semibold"><Link className="text-violet-300 underline" href={`/admin/applications/${a.id}`}>{a.reference}</Link></Td>
                <Td>{a.organization?.name ?? a.applicant.name}<span className="block text-xs text-ink-600">{a.applicantCategory.replace("_", " ").toLowerCase()}</span></Td>
                <Td className="min-w-48">{a.opportunity.title}<span className="block text-xs text-ink-600">{a.opportunity.reference}</span>{a.opportunity.classification === "DEMO" ? <DemoBadge compact className="mt-1" /> : null}</Td>
                <Td><StatusBadge status={a.status} /></Td>
                <Td className="whitespace-nowrap">{formatDate(a.submittedAt)}</Td>
                <Td className={cn(!a.assignments[0] && "italic text-ink-600")}>{a.assignments[0]?.reviewer.name ?? "Unassigned"}</Td>
                <Td className="whitespace-nowrap">{formatDate(a.updatedAt)}</Td>
              </tr>))}</tbody>
          </Table></TableWrap>
          <Pagination page={res.page} pages={res.pages} hrefFor={(n) => `/admin/applications${qs({ ...base, page: n })}`} />
        </>
      )}
    </div>
  );
}
