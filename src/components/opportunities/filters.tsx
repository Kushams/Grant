import Link from "next/link";
import { Search } from "lucide-react";
import { APPLICANT_TYPES, APPLICANT_TYPE_LABELS, CURRENCIES, CURRENCY_CODES, PROGRAMME_CATEGORIES, REGIONS } from "@/lib/constants";
import type { SearchParams } from "@/lib/services/opportunities";
import { Button, buttonClasses } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form";

/** Plain GET form: works without JavaScript and every control really changes the server query. */
export function DirectoryFilters({ p }: { p: SearchParams }) {
  const active = Object.entries(p).some(([k, v]) => !["page", "sort"].includes(k) && v);
  return (
    <form method="get" action="/opportunities" className="space-y-4 rounded-xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]" aria-label="Search and filter opportunities">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1"><TextField label="Search" name="q" type="search" defaultValue={p.q ?? ""} placeholder="Title, description or keyword" /></div>
        <Button type="submit" className="sm:w-auto"><Search className="size-4" aria-hidden="true" /> Search</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField label="Applicant type" name="applicantType" defaultValue={p.applicantType ?? ""} placeholder="Any" options={APPLICANT_TYPES.map((t) => ({ value: t, label: APPLICANT_TYPE_LABELS[t] }))} />
        <SelectField label="Programme category" name="category" defaultValue={p.category ?? ""} placeholder="Any" options={PROGRAMME_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <SelectField label="Eligible region" name="region" defaultValue={p.region ?? ""} placeholder="Any" options={REGIONS.map((c) => ({ value: c, label: c }))} />
        <SelectField label="Status" name="status" defaultValue={p.status ?? ""} placeholder="Any" options={[{ value: "open", label: "Open for applications" }, { value: "upcoming", label: "Opening soon" }, { value: "closed", label: "Closed" }]} />
        <SelectField label="Deadline" name="deadline" defaultValue={p.deadline ?? ""} placeholder="Any" options={[{ value: "7", label: "Within 7 days" }, { value: "30", label: "Within 30 days" }, { value: "90", label: "Within 90 days" }, { value: "none", label: "No deadline set" }]} />
        <SelectField label="Funding currency" name="currency" defaultValue={p.currency ?? ""} placeholder="Any" options={CURRENCY_CODES.map((c) => ({ value: c, label: `${c} — ${CURRENCIES[c].name}` }))} />
        <TextField label="Funding of at least" name="minFunding" inputMode="decimal" defaultValue={p.minFunding ?? ""} placeholder="e.g. 5000" hint="Needs a currency. Only opportunities with a stated amount match." />
        <SelectField label="Sort by" name="sort" defaultValue={p.sort ?? "newest"} options={[{ value: "newest", label: "Newest first" }, { value: "deadline", label: "Nearest deadline" }, { value: "funding", label: "Highest funding" }, { value: "title", label: "Title A–Z" }]} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent">Apply filters</Button>
        {active ? <Link href="/opportunities" className={buttonClasses("outline")}>Clear all filters</Link> : null}
      </div>
    </form>
  );
}
