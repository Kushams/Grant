import Link from "next/link";
import { DEMO_SITE, FOOTER_LEGAL, NO_FEE_STATEMENT, NO_GUARANTEE_STATEMENT, ORG, PRIMARY_NAV } from "@/config/organization";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-navy-950 text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-md text-sm text-white/60">{ORG.description}</p>
          <p className="max-w-md text-sm text-white/60">
            {ORG.name} is an independent organization. It is not a government agency, and nothing on this site is an official government programme.
          </p>
          <p className="max-w-md text-sm text-white/60">{NO_GUARANTEE_STATEMENT} {NO_FEE_STATEMENT}</p>
        </div>
        <nav aria-label="Explore" className="text-sm">
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-white">Explore</h2>
          <ul className="mt-3 space-y-2">
            {PRIMARY_NAV.map((l) => <li key={l.href}><Link className="text-white/80 underline-offset-4 hover:underline" href={l.href}>{l.label}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Legal and safety" className="text-sm">
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-white">Policies &amp; safety</h2>
          <ul className="mt-3 space-y-2">
            {FOOTER_LEGAL.map((l) => <li key={l.label}><Link className="text-white/80 underline-offset-4 hover:underline" href={l.href}>{l.label}</Link></li>)}
          </ul>
        </nav>
      </div>
      <div className="border-t border-navy-800">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/60">
          © {new Date().getFullYear()} {ORG.legalName}.{DEMO_SITE ? " Prototype for internal review — policy pages are drafts and no real programme, partner or funding is represented." : " An independent organization; not a government agency."}
        </p>
      </div>
    </footer>
  );
}
