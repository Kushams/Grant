import type { ReactNode } from "react";
import { NavLink } from "./nav-link";

export type SideItem = { href: string; label: string; icon: ReactNode; exact?: boolean; badge?: number };

/** Vertical on desktop; horizontally scrollable pill row on small screens. */
export function SideNav({ items, label }: { items: SideItem[]; label: string }) {
  return (
    <nav aria-label={label} className="lg:sticky lg:top-6">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map((i) => (
          <li key={i.href} className="shrink-0">
            <NavLink href={i.href} exact={i.exact}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-white lg:w-full"
              activeClassName="bg-white text-navy-900 shadow-[var(--shadow-card)] ring-1 ring-ink-200">
              <span className="text-navy-500" aria-hidden="true">{i.icon}</span>
              <span>{i.label}</span>
              {i.badge ? <span className="ml-auto rounded-full bg-bad-700 px-2 py-0.5 text-xs font-bold text-white"><span className="sr-only">{i.badge} unread </span><span aria-hidden="true">{i.badge}</span></span> : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
