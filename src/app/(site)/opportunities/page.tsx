import { redirect } from "next/navigation";
import { DEMO_SITE } from "@/config/organization";
import type { Metadata } from "next";
import { searchOpportunities } from "@/lib/services/opportunities";
import { parseDirectoryParams } from "@/lib/search-params";
import { DirectoryFilters } from "@/components/opportunities/filters";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { NetworkBanner } from "@/components/graphics/network-banner";
import { FundCard } from "@/components/opportunities/fund-card";
import { Alert, EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { qs, pluralize } from "@/lib/format";
import { Search } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Opportunities", description: "Search and filter funding opportunities on National Empowerment Network." };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!DEMO_SITE) redirect("/fund"); // live site: no public directory or applicant accounts
  const { params, ignored } = parseDirectoryParams(await searchParams);
  const result = await searchOpportunities(params);
  const base = { q: params.q, applicantType: params.applicantType, category: params.category, region: params.region, status: params.status, deadline: params.deadline, currency: params.currency, minFunding: params.minFunding, sort: params.sort };
  const unfiltered = !Object.values(base).some(Boolean);
  const showFund = !DEMO_SITE && result.total === 0 && unfiltered;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <NetworkBanner className="mb-6 h-24 w-full rounded-2xl" />
      <PageHeader eyebrow="Opportunity directory" title="Find an opportunity"
        description={DEMO_SITE ? "Every opportunity currently listed is a fictional demonstration for testing this platform. None is a live funding offer." : "Funding opportunities listed on the network. Each page shows its status, eligibility and what is still to be confirmed."} />
      <DirectoryFilters p={params} />
      {ignored.length ? (
        <Alert tone="warn" className="mt-4" title="Some filters were not recognised">
          These values were ignored: {ignored.join(", ")}. Showing results for the remaining filters.
        </Alert>
      ) : null}
      {showFund ? <><ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><li><FundCard /></li></ul><p className="mt-8 text-sm text-ink-700">Looking for other funders? Browse <Link href="/other-grants" className="font-semibold text-navy-800 underline">grants from other organizations</Link> — healthcare, education, family, small business and more.</p></> : <>
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
      </>}
    </div>
  );
}
