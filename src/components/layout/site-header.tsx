import { DEMO_SITE, PROTOTYPE_NOTICE, getNavItems } from "@/config/organization";
import { getCurrentUser } from "@/lib/auth/session";
import { unreadCount } from "@/lib/services/notifications";
import { can } from "@/lib/permissions";
import { MainNav, type NavAccount } from "./main-nav";

/** Account info for the nav, derived from the server-side session. */
export async function getNavAccount(): Promise<NavAccount> {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, homeHref: "/dashboard", homeLabel: "My dashboard", unread: 0, notificationsHref: null };
  const staff = can(user.role, "admin:access");
  return {
    signedIn: true,
    homeHref: staff ? "/admin" : "/dashboard",
    homeLabel: staff ? "Staff area" : "My dashboard",
    unread: await unreadCount(user.id),
    notificationsHref: staff ? "/admin/notifications" : "/dashboard/notifications",
  };
}

export function PrototypeBanner({ className = "" }: { className?: string }) {
  if (!DEMO_SITE) return null;
  return (
    <div className={`border-b border-warn-700/25 bg-warn-50 text-warn-700 ${className}`}>
      <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs font-medium sm:text-sm">{PROTOTYPE_NOTICE} All opportunities shown are fictional demonstrations.</p>
    </div>
  );
}

export async function SiteHeader() {
  const account = await getNavAccount();
  return (
    <header>
      <PrototypeBanner />
      <MainNav variant="bar" items={getNavItems()} account={account} showAccount={DEMO_SITE} />
    </header>
  );
}
