"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import emblem from "@/assets/emblem.png";
import { logoutAction } from "@/app/actions/auth";
import { ORG, type NavItem } from "@/config/organization";
import { cn } from "@/lib/cn";

export type NavAccount = { signedIn: boolean; homeHref: string; homeLabel: string; unread: number; notificationsHref: string | null };
type Props = { variant: "overlay" | "bar"; items: NavItem[]; account: NavAccount; showAccount?: boolean };

const ghost = "liquid-glass inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-white transition-colors hover:bg-white/5";
const solid = "inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-[#0b1220] transition-colors hover:bg-white/90";

/**
 * Liquid-glass navigation used as the hero overlay (home) and as the sticky bar elsewhere.
 * Menus are disclosures: aria-expanded, Escape closes (focus returns to the trigger), outside click closes,
 * and navigating closes (open state is tied to the path it was opened on, so no effect is needed).
 */
export function MainNav({ variant, items, account, showAccount = true }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState<{ id: "mobile" | "resources"; path: string } | null>(null);
  const [mobileRes, setMobileRes] = useState(false);
  const isOpen = (id: "mobile" | "resources") => open?.id === id && open.path === pathname;
  const toggle = useCallback((id: "mobile" | "resources") => setOpen((cur) => (cur?.id === id && cur.path === pathname ? null : { id, path: pathname })), [pathname]);
  const root = useRef<HTMLDivElement>(null);
  const mobileBtn = useRef<HTMLButtonElement>(null);
  const resBtn = useRef<HTMLButtonElement>(null);
  const anyOpen = open !== null && open.path === pathname;

  useEffect(() => {
    if (!anyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const id = open?.id;
      setOpen(null);
      (id === "resources" ? resBtn : mobileBtn).current?.focus();
    };
    const onPointer = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [anyOpen, open?.id]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
  const childActive = (it: NavItem) => !!it.children?.some((c) => active(c.href));

  const cta = !showAccount ? null : account.signedIn ? (
    <>
      <form action={logoutAction}><button type="submit" className={cn(ghost, "w-full")}>Sign out</button></form>
      <Link href={account.homeHref} className={solid}>{account.homeLabel}</Link>
    </>
  ) : (
    <>
      <Link href="/login" className={ghost}>Log in</Link>
      <Link href="/register" className={solid}>Get Started</Link>
    </>
  );

  return (
    <div ref={root} className={cn(variant === "overlay" ? "nav-in relative z-30" : "sticky top-0 z-40 border-b border-white/10 bg-[#0b1220]/85 backdrop-blur-xl")}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-base font-medium text-white" aria-label={`${ORG.name} — home`}>
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm"><Image src={emblem} alt="" width={40} height={40} unoptimized className="size-10 object-contain" /></span>
          <span className="max-w-[11rem] leading-tight sm:max-w-none">{ORG.name}</span>
        </Link>

        <nav aria-label="Primary" className="liquid-glass hidden items-center gap-1 rounded-full px-1.5 py-1.5 lg:flex">
          {items.map((it) =>
            it.children ? (
              <div key={it.label} className="relative">
                <button ref={resBtn} type="button" aria-expanded={isOpen("resources")} aria-controls="nav-resources" onClick={() => toggle("resources")}
                  className={cn("flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors", childActive(it) || isOpen("resources") ? "bg-white/15 text-white" : "text-white/70 hover:text-white")}>
                  {it.label}<ChevronDown size={14} aria-hidden="true" className={cn("mt-px transition-transform", isOpen("resources") && "rotate-180")} />
                </button>
                <ul id="nav-resources" hidden={!isOpen("resources")} className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#12141b]/95 p-2 shadow-2xl backdrop-blur-xl">
                  {it.children.map((c) => (
                    <li key={c.href}><Link href={c.href} aria-current={active(c.href) ? "page" : undefined} className="block rounded-xl px-3 py-2.5 text-sm text-white/85 hover:bg-white/10 aria-[current=page]:bg-white/10"><span className="font-medium text-white">{c.label}</span>{c.hint ? <span className="block text-xs text-white/60">{c.hint}</span> : null}</Link></li>
                  ))}
                </ul>
              </div>
            ) : (
              <Link key={it.href} href={it.href} aria-current={active(it.href) ? "page" : undefined}
                className={cn("rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors", active(it.href) ? "bg-white/15 text-white" : "text-white/70 hover:text-white")}>{it.label}</Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {showAccount && account.signedIn && account.notificationsHref ? (
            <Link href={account.notificationsHref} className="liquid-glass relative inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/5" aria-label={account.unread ? `Notifications, ${account.unread} unread` : "Notifications, none unread"}>
              <Bell className="size-5" aria-hidden="true" />
              {account.unread > 0 ? <span aria-hidden="true" className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{account.unread > 99 ? "99+" : account.unread}</span> : null}
            </Link>
          ) : null}
          <div className="hidden items-center gap-2 lg:flex">{cta}</div>
          <button ref={mobileBtn} type="button" aria-expanded={isOpen("mobile")} aria-controls="mobile-menu" onClick={() => toggle("mobile")}
            className="liquid-glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-white lg:hidden">
            {isOpen("mobile") ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            <span>{isOpen("mobile") ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      <div id="mobile-menu" hidden={!isOpen("mobile")} className="absolute inset-x-4 top-full z-40 mt-1 max-h-[calc(100svh-6rem)] overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1220] p-4 shadow-2xl backdrop-blur-xl lg:hidden">
        <nav aria-label="Mobile primary" className="flex flex-col gap-1">
          {items.map((it) =>
            it.children ? (
              <div key={it.label}>
                <button type="button" aria-expanded={mobileRes} aria-controls="mobile-resources" onClick={() => setMobileRes((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/85 hover:bg-white/10">
                  {it.label}<ChevronDown size={16} aria-hidden="true" className={cn("transition-transform", mobileRes && "rotate-180")} />
                </button>
                <ul id="mobile-resources" hidden={!mobileRes} className="ml-3 border-l border-white/10 pl-2">
                  {it.children.map((c) => <li key={c.href}><Link href={c.href} aria-current={active(c.href) ? "page" : undefined} className="block rounded-xl px-4 py-2.5 text-sm text-white/75 hover:bg-white/10 aria-[current=page]:text-white">{c.label}</Link></li>)}
                </ul>
              </div>
            ) : (
              <Link key={it.href} href={it.href} aria-current={active(it.href) ? "page" : undefined}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/85 hover:bg-white/10 aria-[current=page]:bg-white/10 aria-[current=page]:text-white">{it.label}</Link>
            ),
          )}
        </nav>
        <div className="mt-3 flex gap-2 border-t border-white/10 pt-3 [&>*]:flex-1">{cta}</div>
      </div>
    </div>
  );
}
