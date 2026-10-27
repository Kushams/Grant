import Link from "next/link";
import { Infinity as InfinityIcon } from "lucide-react";
import { ORG } from "@/config/organization";

/** Neutral typographic mark. No seals, crests, flags or partner logos. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label={`${ORG.name} — home`}>
      <span aria-hidden="true" className={`grid size-10 place-items-center rounded-lg  ${inverted ? "bg-white text-navy-900" : "bg-navy-800 text-white"}`}>
        <InfinityIcon size={22} strokeWidth={1.75} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`font-display text-base font-semibold sm:text-lg ${inverted ? "text-white" : "text-navy-900"}`}>{ORG.name}</span>
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${inverted ? "text-navy-200" : "text-teal-700"}`}>Independent opportunity platform</span>
      </span>
    </Link>
  );
}
