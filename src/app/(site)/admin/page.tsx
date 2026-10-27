import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { adminOverview } from "@/lib/services/stats";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, PageHeader, Stat } from "@/components/ui/misc";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";
import { formatMinor } from "@/lib/money";

export const metadata: Metadata = { title: "Staff overview" };

export default async function AdminHome() {
  const user = await requirePermission("admin:access", "/admin");
  const o = await adminOverview({ id: user.id, role: user.role, name: user.name });
  const max = Math.max(1, ...Object.values(o.statusMap));
  const rows = APPLICATION_STATUSES.filter((s) => (o.statusMap[s] ?? 0) > 0);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={o.isAdmin ? "Administration" : "Reviewer"} title="Overview" description={o.isAdmin ? "Live figures calculated from the database." : "Figures for the applications assigned to you."} />
      <Alert tone="warn" title="Demonstration data">All figures below come from fictional seeded records. They are not organizational impact, and no real money is represented or moved.</Alert>

      {o.isAdmin ? (
        <section aria-label="Opportunities" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total opportunities" value={o.opportunities.total} href="/admin/opportunities" />
          <Stat label="Published" value={o.opportunities.published} tone="teal" href="/admin/opportunities?status=PUBLISHED" />
          <Stat label="Drafts" value={o.opportunities.draft} href="/admin/opportunities?status=DRAFT" />
          <Stat label="Open support requests" value={o.supportOpen} tone={o.supportOpen ? "warn" : "navy"} href="/admin/support" />
        </section>
      ) : null}

      <section aria-label="Applications" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={o.isAdmin ? "Total applications" : "Assigned to me"} value={o.totalApplications} href="/admin/applications" />
        <Stat label="Awaiting review" value={o.awaitingReview} tone="warn" href="/admin/applications?status=SUBMITTED" hint={o.isAdmin ? `${o.unassigned} not yet assigned` : undefined} />
        <Stat label="Info / revision requested" value={o.infoRequested} href="/admin/applications?status=INFO_REQUESTED" />
        <Stat label="Recommended for approval" value={o.recommended} tone="teal" href="/admin/applications?status=RECOMMENDED" />
        <Stat label="Approved (incl. award stages)" value={o.approved} tone="teal" />
        <Stat label="Declined" value={o.declined} tone="bad" href="/admin/applications?status=DECLINED" />
      </section>

      <Card>
        <CardHeader title="Applications by status" description="Bar length is proportional to the count." />
        <CardBody>
          {rows.length === 0 ? <p className="text-sm text-ink-600">No submitted applications yet.</p> : (
            <ul className="space-y-2.5">
              {rows.map((s) => {
                const n = o.statusMap[s] ?? 0;
                return (
                  <li key={s} className="grid grid-cols-[11rem_1fr_2rem] items-center gap-3 text-sm">
                    <span className="truncate text-ink-800">{STATUS_LABELS[s as ApplicationStatus]}</span>
                    <span className="h-3 rounded-full bg-ink-100"><span className="block h-3 rounded-full bg-navy-600" style={{ width: `${(n / max) * 100}%` }} /></span>
                    <span className="text-right font-semibold">{n}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {o.isAdmin ? (
        <Card>
          <CardHeader title="Awards and disbursements" description="Totals per currency, from persisted records. “Recorded as paid” is a manual staff entry, not provider-verified." />
          <CardBody>
            {o.money.length === 0 ? <p className="text-sm text-ink-600">No award records yet.</p> : (
              <div className="grid gap-4 md:grid-cols-2">
                {o.money.map((m) => (
                  <div key={m.currency} className="rounded-lg border border-ink-200 p-4">
                    <p className="font-semibold text-white">{m.currency} — {m.count} award{m.count === 1 ? "" : "s"}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                      <dt className="text-ink-600">Total approved</dt><dd className="text-right font-semibold">{formatMinor(m.awarded, m.currency)}</dd>
                      <dt className="text-ink-600">Scheduled (planned)</dt><dd className="text-right">{formatMinor(m.scheduled, m.currency)}</dd>
                      <dt className="text-ink-600">Recorded as paid (manual)</dt><dd className="text-right">{formatMinor(m.paid, m.currency)}</dd>
                      <dt className="text-ink-600">Outstanding balance</dt><dd className="text-right">{formatMinor(m.outstanding, m.currency)}</dd>
                      <dt className="text-ink-600">Overdue instalments</dt><dd className={`text-right ${m.overdue ? "font-bold text-bad-700" : ""}`}>{m.overdue}</dd>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
