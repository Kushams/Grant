import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Bookmark, Award, Bell, LifeBuoy } from "lucide-react";
import { requireApplicant } from "@/lib/auth/session";
import { applicantOverview } from "@/lib/services/stats";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DemoBadge, DisbursementBadge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, ProgressBar, Stat } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatMinor } from "@/lib/money";

export const metadata: Metadata = { title: "My dashboard" };

export default async function DashboardHome() {
  const user = await requireApplicant("/dashboard");
  const o = await applicantOverview({ id: user.id, role: user.role, name: user.name });
  const isOrg = user.role === "ORGANIZATION_APPLICANT";
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={isOrg ? o.organizationName ?? "Organization" : "Your dashboard"} title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Everything below is calculated from your own records. Applying never guarantees funding."
        actions={<LinkButton href="/opportunities">Find an opportunity</LinkButton>} />

      <Card><CardBody className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <ProgressBar label={isOrg ? "Organization profile completion" : "Profile completion"} value={o.completion.percent} />
          {o.completion.missing.length ? <p className="mt-2 text-sm text-ink-600">Still to add: {o.completion.missing.join(", ")}.</p> : <p className="mt-2 text-sm text-ok-700">Your profile is complete.</p>}
        </div>
        <LinkButton href="/dashboard/profile" variant="outline">{o.completion.percent < 100 ? "Complete profile" : "View profile"}</LinkButton>
      </CardBody></Card>

      <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Draft applications" value={o.drafts.length} href="/dashboard/applications?status=DRAFT" />
        <Stat label="Submitted" value={o.submitted.length} href="/dashboard/applications" tone="teal" />
        <Stat label="Need your action" value={o.needsAction.length} tone={o.needsAction.length ? "warn" : "navy"} href="/dashboard/applications" hint="Drafts, information requests and revisions" />
        <Stat label="Under review" value={o.underReview.length} href="/dashboard/applications" />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Applications requiring action" action={<Link className="text-sm font-semibold text-navy-800 underline" href="/dashboard/applications">All applications</Link>} />
          <CardBody>
            {o.total === 0 ? <EmptyState icon={<FileText className="size-8" />} title="You haven’t started an application yet." description="Browse the opportunity directory, read the eligibility, then choose “Start application”." action={{ href: "/opportunities", label: "Explore opportunities" }} />
              : o.needsAction.length === 0 ? <p className="text-sm text-ink-600">Nothing needs your attention right now.</p>
              : <ul className="divide-y divide-ink-100">{o.needsAction.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div><p className="font-semibold text-ink-900">{a.opportunity.title}</p><p className="mt-1 flex items-center gap-2 text-xs text-ink-600"><StatusBadge status={a.status} />{a.reference ?? "Draft"}{a.opportunity.classification === "DEMO" ? <DemoBadge compact /> : null}</p></div>
                    <LinkButton size="sm" variant="accent" href={a.status === "INFO_REQUESTED" ? `/dashboard/applications/${a.id}` : `/dashboard/applications/${a.id}/edit`}>{a.status === "INFO_REQUESTED" ? "Reply" : a.status === "DRAFT" ? "Continue" : "Edit & resubmit"}</LinkButton>
                  </li>))}</ul>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent decisions" />
          <CardBody>
            {o.decisions.length === 0 ? <p className="text-sm text-ink-600">No decisions have been recorded on your applications yet.</p>
              : <ul className="divide-y divide-ink-100">{o.decisions.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div><p className="font-semibold text-ink-900">{a.opportunity.title}</p><p className="mt-1 text-xs text-ink-600">{a.reference} · decided {formatDate(a.decidedAt)}</p></div>
                    <div className="flex items-center gap-3"><StatusBadge status={a.status} /><Link className="text-sm font-semibold text-navy-800 underline" href={`/dashboard/applications/${a.id}`}>Details</Link></div>
                  </li>))}</ul>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Saved opportunities" action={<Link className="text-sm font-semibold text-navy-800 underline" href="/dashboard/saved">View all</Link>} />
          <CardBody>
            {o.saved.length === 0 ? <EmptyState icon={<Bookmark className="size-8" />} title="No opportunities are currently saved." description="Use “Save for later” on an opportunity page to keep it here." />
              : <ul className="divide-y divide-ink-100">{o.saved.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <Link href={`/opportunities/${s.opportunity.slug}`} className="font-semibold text-ink-900 underline-offset-2 hover:underline">{s.opportunity.title}</Link>
                    <span className="text-xs text-ink-600">{s.opportunity.deadline ? `Deadline ${formatDate(s.opportunity.deadline)}` : "Deadline to be confirmed"}</span>
                  </li>))}</ul>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={`Notifications${o.unread ? ` (${o.unread} unread)` : ""}`} action={<Link className="text-sm font-semibold text-navy-800 underline" href="/dashboard/notifications">View all</Link>} />
          <CardBody>
            {o.notifications.length === 0 ? <EmptyState icon={<Bell className="size-8" />} title="No notifications yet" />
              : <ul className="divide-y divide-ink-100">{o.notifications.map((n) => (
                  <li key={n.id} className="py-3 first:pt-0 last:pb-0"><p className="text-sm font-semibold text-ink-900">{!n.readAt ? <span className="mr-2 inline-block size-2 rounded-full bg-info-700" aria-label="unread" /> : null}{n.title}</p><p className="text-xs text-ink-600">{formatDateTime(n.createdAt)}</p></li>))}</ul>}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Awards and planned disbursements" action={<Link className="text-sm font-semibold text-navy-800 underline" href="/dashboard/awards">Details</Link>} />
          <CardBody>
            {o.awards.length === 0 ? <EmptyState icon={<Award className="size-8" />} title="There are no award records associated with your account." description="If an application is approved, staff may record an award here. Nothing is guaranteed by applying." />
              : (
                <div className="grid gap-6 md:grid-cols-2">
                  <ul className="space-y-3">{o.awards.map((a) => (
                    <li key={a.id} className="rounded-lg border border-ink-200 p-4"><p className="font-semibold text-ink-900">{a.reference} · {a.application.reference}</p><p className="mt-1 text-sm text-ink-700">Approved {formatMinor(a.amountMinor, a.currency)} · recorded as paid {formatMinor(a.summary.paidRecordedMinor, a.currency)} · remaining {formatMinor(a.summary.outstandingMinor, a.currency)}</p></li>))}</ul>
                  <div><h3 className="mb-2 font-sans text-sm font-bold tracking-normal text-ink-900">Upcoming planned instalments</h3>
                    {o.upcoming.length === 0 ? <p className="text-sm text-ink-600">No upcoming instalments are planned.</p> : <ul className="space-y-2">{o.upcoming.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 text-sm"><span>{formatDate(d.plannedDate)} · {formatMinor(d.amountMinor, d.currency)}</span><DisbursementBadge status={d.status} /></li>))}</ul>}
                  </div>
                </div>)}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Support requests" action={<Link className="text-sm font-semibold text-navy-800 underline" href="/dashboard/support">View all</Link>} />
          <CardBody>
            {o.support.length === 0 ? <EmptyState icon={<LifeBuoy className="size-8" />} title="No support requests" description="Need help? Send us a message — it is stored in our in-app support queue." action={{ href: "/contact", label: "Contact support" }} />
              : <ul className="divide-y divide-ink-100">{o.support.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{s.reference} — {s.topic}</span><span className="text-xs font-semibold uppercase text-ink-600">{s.status.replace("_", " ")}</span></li>)}</ul>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
