import { Award, Bell, Bookmark, FileText, LayoutDashboard, LifeBuoy, UserRound, Building2 } from "lucide-react";
import { requireApplicant } from "@/lib/auth/session";
import { unreadCount } from "@/lib/services/notifications";
import { SideNav } from "@/components/layout/side-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireApplicant("/dashboard");
  const unread = await unreadCount(user.id);
  const isOrg = user.role === "ORGANIZATION_APPLICANT";
  const ic = "size-5";
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[14rem_1fr]">
      <SideNav label="Dashboard" items={[
        { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className={ic} />, exact: true },
        { href: "/dashboard/applications", label: "Applications", icon: <FileText className={ic} /> },
        { href: "/dashboard/saved", label: "Saved opportunities", icon: <Bookmark className={ic} /> },
        { href: "/dashboard/awards", label: "Awards & payments", icon: <Award className={ic} /> },
        { href: "/dashboard/notifications", label: "Notifications", icon: <Bell className={ic} />, badge: unread },
        { href: "/dashboard/support", label: "Support", icon: <LifeBuoy className={ic} /> },
        { href: "/dashboard/profile", label: isOrg ? "Organization profile" : "My profile", icon: isOrg ? <Building2 className={ic} /> : <UserRound className={ic} /> },
      ]} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
