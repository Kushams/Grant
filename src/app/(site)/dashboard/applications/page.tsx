import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireApplicant } from "@/lib/auth/session";
import { listApplicantApplications } from "@/lib/services/applications";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";
import { ApplicationTable } from "@/components/dashboard/application-table";
import { Button, buttonClasses } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { qs } from "@/lib/format";

export const metadata: Metadata = { title: "My applications" };

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const user = await requireApplicant("/dashboard/applications");
  const sp = await searchParams;
  const status = (APPLICATION_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const res = await listApplicantApplications({ id: user.id, role: user.role, name: user.name }, { q: sp.q?.trim().slice(0, 80) || undefined, status, page });
  const filtered = !!(sp.q || status);
  return (
    <div>
      <PageHeader title="My applications" description="Search and filter every application you can access." actions={<Link className={buttonClasses("primary")} href="/opportunities">Start a new application</Link>} />
      <form method="get" className="mb-6 grid gap-4 rounded-xl border border-ink-200 bg-white p-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end" aria-label="Filter applications">
        <TextField label="Search" name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Reference or opportunity title" />
        <SelectField label="Status" name="status" defaultValue={status ?? ""} placeholder="All statuses" options={APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s as ApplicationStatus] }))} />
        <div className="flex gap-2"><Button type="submit">Filter</Button>{filtered ? <Link href="/dashboard/applications" className={buttonClasses("outline")}>Clear</Link> : null}</div>
      </form>
      {res.rows.length === 0 ? (
        filtered ? <EmptyState icon={<FileText className="size-8" />} title="No applications match those filters" action={{ href: "/dashboard/applications", label: "Clear filters" }} />
          : <EmptyState icon={<FileText className="size-8" />} title="You haven’t started an application yet." description="Find an opportunity that fits and choose “Start application”." action={{ href: "/opportunities", label: "Explore opportunities" }} />
      ) : (
        <>
          <ApplicationTable rows={res.rows} />
          <Pagination page={res.page} pages={res.pages} hrefFor={(n) => `/dashboard/applications${qs({ q: sp.q, status, page: n })}`} />
        </>
      )}
    </div>
  );
}
