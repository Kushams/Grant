import { Award, Bell, ClipboardList, FileDown, History, LayoutDashboard, LifeBuoy, Megaphone, Settings, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { unreadCount } from "@/lib/services/notifications";
import { can } from "@/lib/permissions";
import { SideNav, type SideItem } from "@/components/layout/side-nav";
import { ROLE_LABELS } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("admin:access", "/admin");
  const unread = await unreadCount(user.id);
  const ic = "size-5";
  const items: SideItem[] = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard className={ic} />, exact: true },
    { href: "/admin/applications", label: user.role === "ADMIN" ? "Applications" : "My review queue", icon: <ClipboardList className={ic} /> },
  ];
  if (can(user.role, "opportunity:manage")) items.push({ href: "/admin/opportunities", label: "Opportunities", icon: <Megaphone className={ic} /> });
  if (can(user.role, "award:view")) items.push({ href: "/admin/awards", label: "Awards & payments", icon: <Award className={ic} /> });
  if (can(user.role, "support:manage")) items.push({ href: "/admin/support", label: "Support inbox", icon: <LifeBuoy className={ic} /> });
  items.push({ href: "/admin/notifications", label: "Notifications", icon: <Bell className={ic} />, badge: unread });
  if (can(user.role, "audit:view")) items.push({ href: "/admin/audit", label: "Audit log", icon: <History className={ic} /> });
  if (can(user.role, "export:run")) items.push({ href: "/admin/exports", label: "CSV exports", icon: <FileDown className={ic} /> });
  if (can(user.role, "users:manage")) items.push({ href: "/admin/users", label: "Users & roles", icon: <Users className={ic} /> });
  if (can(user.role, "opportunity:manage")) items.push({ href: "/admin/configuration", label: "Configuration", icon: <Settings className={ic} /> });
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[14.5rem_1fr]">
      <div>
        <p className="mb-3 hidden rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white lg:block">{ROLE_LABELS[user.role]}<span className="block font-normal text-white/60">{user.name}</span></p>
        <SideNav label="Staff area" items={items} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
