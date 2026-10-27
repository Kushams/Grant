import Link from "next/link";
import { Bell } from "lucide-react";
import { PRIMARY_NAV, PROTOTYPE_NOTICE } from "@/config/organization";
import { getCurrentUser } from "@/lib/auth/session";
import { unreadCount } from "@/lib/services/notifications";
import { can } from "@/lib/permissions";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { buttonClasses } from "../ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await unreadCount(user.id) : 0;
  const home = user ? (can(user.role, "admin:access") ? "/admin" : "/dashboard") : null;
  const notificationsHref = user ? (can(user.role, "admin:access") ? "/admin/notifications" : "/dashboard/notifications") : null;

  const accountLinks = user ? (
    <>
      <Link href={home!} className={buttonClasses("outline", "md")}>{can(user.role, "admin:access") ? "Staff area" : "My dashboard"}</Link>
      <form action={logoutAction}><button type="submit" className={buttonClasses("ghost", "md", "w-full")}>Sign out</button></form>
    </>
  ) : (
    <>
      <Link href="/login" className={buttonClasses("outline", "md")}>Sign in</Link>
      <Link href="/register" className={buttonClasses("primary", "md")}>Register</Link>
    </>
  );

  return (
    <header className="relative z-30 border-b border-ink-200 bg-white">
      <div className="bg-warn-50 text-warn-700 border-b border-warn-700/20">
        <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs font-semibold sm:text-sm">
          {PROTOTYPE_NOTICE} All opportunities shown are fictional demonstrations.
        </p>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((i) => (
            <NavLink key={i.href} href={i.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-navy-50" activeClassName="bg-navy-50 text-navy-800">
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user && notificationsHref ? (
            <Link href={notificationsHref} className="relative inline-flex size-11 items-center justify-center rounded-lg border border-ink-300 bg-white text-ink-800 hover:bg-ink-50" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications, none unread"}>
              <Bell className="size-5" aria-hidden="true" />
              {unread > 0 ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-bad-700 px-1 text-[11px] font-bold text-white" aria-hidden="true">{unread > 99 ? "99+" : unread}</span> : null}
            </Link>
          ) : null}
          <div className="hidden items-center gap-2 lg:flex">{accountLinks}</div>
          <MobileNav items={PRIMARY_NAV} extra={accountLinks} />
        </div>
      </div>
    </header>
  );
}
