"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Infinity as InfinityIcon, Menu, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { ORG } from "@/config/organization";

type Link_ = { href: string; label: string };
type Props = { links: Link_[]; account: { signedIn: boolean; homeHref: string; homeLabel: string } };

const ghost = "liquid-glass text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/5 transition-colors inline-flex items-center justify-center";
const solid = "bg-white text-black text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/90 transition-colors inline-flex items-center justify-center";

/** Liquid-glass navbar that overlays the hero video. Mobile menu is a disclosure (aria-expanded, Esc closes, closes on navigation). */
export function HeroNav({ links, account }: Props) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = useCallback((v: boolean) => setOpenPath(v ? pathname : null), [pathname]);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const cta = account.signedIn ? (
    <>
      <form action={logoutAction}><button type="submit" className={`${ghost} w-full`}>Sign out</button></form>
      <Link href={account.homeHref} className={solid}>{account.homeLabel}</Link>
    </>
  ) : (
    <>
      <Link href="/login" className={ghost}>Sign in</Link>
      <Link href="/register" className={solid}>Register</Link>
    </>
  );

  return (
    <div className="relative z-30">
      <div className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-base font-medium text-white" aria-label={`${ORG.name} — home`}>
          <InfinityIcon size={22} strokeWidth={1.5} aria-hidden="true" />
          <span>{ORG.name}</span>
        </Link>
        <nav aria-label="Primary" className="liquid-glass hidden items-center gap-1 rounded-xl px-2 py-2 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-0.5 rounded-md px-3 py-1.5 text-sm text-white/80 transition-colors hover:text-white">{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">{cta}</div>
        <button ref={btn} type="button" aria-expanded={open} aria-controls="hero-menu" onClick={() => setOpen(!open)} className="liquid-glass inline-flex min-h-11 items-center gap-2 rounded-lg p-2 px-3 text-white lg:hidden">
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          <span className="text-sm">{open ? "Close" : "Menu"}</span>
        </button>
      </div>
      <div id="hero-menu" hidden={!open} className="liquid-glass absolute left-4 right-4 top-full z-40 mt-1 flex flex-col gap-1 rounded-2xl bg-navy-950/95 p-4 backdrop-blur-xl lg:hidden">
        <nav aria-label="Mobile primary" className="flex flex-col gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-white/90 hover:bg-white/10">{l.label}</Link>
          ))}
        </nav>
        <div className="mt-2 flex gap-2 border-t border-white/10 pt-3 [&>*]:flex-1">{cta}</div>
      </div>
    </div>
  );
}
