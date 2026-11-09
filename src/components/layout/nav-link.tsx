"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Link that sets aria-current when its route (or, for sections, a child route) is active. */
export function NavLink({ href, exact = false, className, activeClassName, ...props }: ComponentProps<typeof Link> & { href: string; exact?: boolean; activeClassName?: string }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return <Link href={href} aria-current={active ? "page" : undefined} className={cn(className, active && activeClassName)} {...props} />;
}
