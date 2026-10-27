import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { requireApplicant } from "@/lib/auth/session";
import { listSaved } from "@/lib/services/opportunities";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { toggleSavedAction } from "@/app/actions/applicant";

export const metadata: Metadata = { title: "Saved opportunities" };

export default async function Saved() {
  const user = await requireApplicant("/dashboard/saved");
  const items = await listSaved(user.id);
  return (
    <div>
      <PageHeader title="Saved opportunities" description="Opportunities you’ve bookmarked to come back to." />
      {items.length === 0 ? <EmptyState icon={<Bookmark className="size-8" />} title="No opportunities are currently saved." description="Open an opportunity and choose “Save for later”." action={{ href: "/opportunities", label: "Explore opportunities" }} />
        : <ul className="grid gap-5 md:grid-cols-2">{items.map((o) => (
          <li key={o.id} className="space-y-2"><OpportunityCard o={o} />
            <form action={toggleSavedAction}><input type="hidden" name="opportunityId" value={o.id} /><input type="hidden" name="back" value="/dashboard/saved" /><Button type="submit" variant="outline" size="sm">Remove from saved<span className="sr-only">: {o.title}</span></Button></form></li>))}</ul>}
    </div>
  );
}
