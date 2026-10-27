import type { Metadata } from "next";
import { searchOpportunities } from "@/lib/services/opportunities";
import { parseDirectoryParams } from "@/lib/search-params";
import { DirectoryFilters } from "@/components/opportunities/filters";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { Alert, EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { qs, pluralize } from "@/lib/format";
import { Search } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Opportunities", description: "Search and filter demonstration opportunities on National Empowerment Network." };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { params, ignored } = parseDirectoryParams(await searchParams);
  const result = await searchOpportunities(params);
  const base = { q: params.q, applicantType: params.applicantType, category: params.category, region: params.region, status: params.status, deadline: params.deadline, currency: params.currency, minFunding: params.minFunding, sort: params.sort };
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Opportunity directory" title="Find an opportunity"
        description="Every opportunity currently listed is a fictional demonstration for testing this platform. None is a live funding offer." />
      <DirectoryFilters p={params} />
      {ignored.length ? (
        <Alert tone="warn" className="mt-4" title="Some filters were not recognised">
          These values were ignored: {ignored.join(", ")}. Showing results for the remaining filters.
        </Alert>
      ) : null}
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2" aria-live="polite">
        <h2 className="font-sans text-lg font-bold tracking-normal text-ink-900">{pluralize(result.total, "opportunity", "opportunities")} found</h2>
        <p className="text-sm text-ink-600">Page {result.page} of {result.pages}</p>
      </div>
      {result.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<Search className="size-8" />} title="No opportunities match your search"
            description="Try removing a filter, checking your spelling or searching a broader keyword." action={{ href: "/opportunities", label: "Clear all filters" }} />
          <p className="mt-4 text-center text-sm text-ink-600">Can’t find what you need? <Link href="/contact" className="font-semibold text-navy-800 underline">Ask support</Link>.</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((o) => <li key={o.id}><OpportunityCard o={o} /></li>)}
        </ul>
      )}
      <Pagination page={result.page} pages={result.pages} hrefFor={(n) => `/opportunities${qs({ ...base, page: n })}`} />
    </div>
  );
}
