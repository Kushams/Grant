"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

type Item = { href: string; label: string };

/** Disclosure-pattern mobile menu: button controls a region, Esc closes, closes on navigation. */
export function MobileNav({ items, extra }: { items: Item[]; extra?: React.ReactNode }) {
  const pathname = usePathname();
  // Open state is tied to the path it was opened on, so navigating closes it without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = useCallback((v: boolean | ((o: boolean) => boolean)) => setOpenPath((cur) => ((typeof v === "function" ? v(cur === pathname) : v) ? pathname : null)), [pathname]);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className="lg:hidden">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink-300 bg-white px-3 text-sm font-semibold text-ink-900"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        <span>{open ? "Close" : "Menu"}</span>
      </button>
      <div id="mobile-menu" hidden={!open} className="absolute inset-x-0 top-full z-40 border-b border-ink-200 bg-white shadow-lg">
        <nav aria-label="Mobile primary" className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={pathname === i.href || pathname.startsWith(i.href + "/") ? "page" : undefined}
              className="rounded-lg px-3 py-3 text-base font-semibold text-ink-900 hover:bg-navy-50 aria-[current=page]:bg-navy-50 aria-[current=page]:text-navy-800">
              {i.label}
            </Link>
          ))}
          {extra ? <div className="mt-2 flex flex-col gap-2 border-t border-ink-100 pt-3">{extra}</div> : null}
        </nav>
      </div>
    </div>
  );
}
