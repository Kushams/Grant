import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Wrapper gives tables sensible small-screen behaviour: horizontal scroll with a focusable region. */
export function TableWrap({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-xl border border-ink-200 bg-surface shadow-[var(--shadow-card)]">
      {children}
    </div>
  );
}
export const Table = ({ className, ...p }: ComponentProps<"table">) => <table className={cn("w-full min-w-[40rem] border-collapse text-left text-sm", className)} {...p} />;
export const Th = ({ className, ...p }: ComponentProps<"th">) => <th scope="col" className={cn("whitespace-nowrap border-b border-ink-200 bg-ink-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink-700", className)} {...p} />;
export const Td = ({ className, ...p }: ComponentProps<"td">) => <td className={cn("border-b border-ink-100 px-4 py-3 align-top text-ink-800", className)} {...p} />;
