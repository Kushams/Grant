import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { listNotifications } from "@/lib/services/notifications";
import { NotificationList } from "@/components/dashboard/notification-list";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Staff notifications" };

export default async function StaffNotifications() {
  const user = await requirePermission("admin:access", "/admin/notifications");
  const items = await listNotifications(user.id);
  return (<div><PageHeader title="Notifications" description="In-app alerts for new applications, replies, assignments and support requests." /><NotificationList items={items} back="/admin/notifications" /></div>);
}
