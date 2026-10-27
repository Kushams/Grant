import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { requireApplicant } from "@/lib/auth/session";
import { listOwnSupport } from "@/lib/services/support";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Support requests" };

export default async function SupportPage() {
  const user = await requireApplicant("/dashboard/support");
  const items = await listOwnSupport(user.id);
  return (
    <div>
      <PageHeader title="Support requests" description="Messages you’ve sent, and any replies from staff." actions={<LinkButton href="/contact">New request</LinkButton>} />
      {items.length === 0 ? <EmptyState icon={<LifeBuoy className="size-8" />} title="No support requests" description="When you contact support while signed in, your request and our replies appear here." action={{ href: "/contact", label: "Contact support" }} />
        : <ul className="space-y-4">{items.map((s) => (
          <li key={s.id}><Card><CardBody>
            <div className="flex flex-wrap items-center gap-2"><strong>{s.reference}</strong><Badge tone={s.status === "RESOLVED" || s.status === "CLOSED" ? "ok" : "info"}>{s.status.replace("_", " ")}</Badge><span className="text-xs text-ink-600">{s.topic} · {formatDateTime(s.createdAt)}{s.relatedRef ? ` · re ${s.relatedRef}` : ""}</span></div>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-800">{s.message}</p>
            {s.notes.length ? <div className="mt-3 space-y-2 border-t border-ink-100 pt-3">{s.notes.map((n) => <div key={n.id} className="rounded-lg bg-teal-50 p-3 text-sm"><p className="text-xs font-bold uppercase text-violet-300">Reply from staff · {formatDateTime(n.createdAt)}</p><p className="mt-1 whitespace-pre-line">{n.body}</p></div>)}</div> : null}
          </CardBody></Card></li>))}</ul>}
    </div>
  );
}
