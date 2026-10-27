import { Bell } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/applicant";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type N = { id: string; title: string; body: string; href: string | null; readAt: Date | null; createdAt: Date };

export function NotificationList({ items, back }: { items: N[]; back: string }) {
  const unread = items.filter((i) => !i.readAt).length;
  if (items.length === 0) return <EmptyState icon={<Bell className="size-8" />} title="No notifications yet" description="Updates about your applications, awards and support requests will appear here." />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-700" aria-live="polite">{unread ? `${unread} unread` : "You’re all caught up"}</p>
        {unread ? <form action={markAllNotificationsReadAction}><input type="hidden" name="back" value={back} /><Button type="submit" variant="outline" size="sm">Mark all as read</Button></form> : null}
      </div>
      <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white">
        {items.map((n) => (
          <li key={n.id} className={cn("flex flex-wrap items-start justify-between gap-3 p-4", !n.readAt && "bg-info-50/60")}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {!n.readAt ? <span className="size-2.5 rounded-full bg-info-700" aria-hidden="true" /> : null}
                <p className="font-semibold text-ink-900">{n.title}{!n.readAt ? <span className="sr-only"> (unread)</span> : null}</p>
              </div>
              <p className="mt-0.5 text-sm text-ink-700">{n.body}</p>
              <time dateTime={new Date(n.createdAt).toISOString()} className="mt-1 block text-xs text-ink-600">{formatDateTime(n.createdAt)}</time>
            </div>
            <div className="flex gap-2">
              {n.href ? (
                <form action={markNotificationReadAction}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="back" value={back} /><input type="hidden" name="href" value={n.href} /><Button type="submit" size="sm" variant="secondary">View</Button></form>
              ) : null}
              {!n.readAt ? <form action={markNotificationReadAction}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="back" value={back} /><Button type="submit" size="sm" variant="ghost">Mark read</Button></form> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
