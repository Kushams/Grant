import type { Metadata } from "next";
import { requireApplicant } from "@/lib/auth/session";
import { listNotifications } from "@/lib/services/notifications";
import { NotificationList } from "@/components/dashboard/notification-list";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Notifications" };

export default async function Notifications() {
  const user = await requireApplicant("/dashboard/notifications");
  const items = await listNotifications(user.id);
  return (
    <div>
      <PageHeader title="Notifications" description="In-app updates only. No emails, SMS or push messages are sent." />
      <NotificationList items={items} back="/dashboard/notifications" />
    </div>
  );
}
