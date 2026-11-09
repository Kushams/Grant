import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { OpportunityEditor } from "@/components/admin/opportunity-editor";
import { emptyEditorValues } from "@/lib/opportunity-form";
import { Alert, PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "New opportunity" };

export default async function NewOpportunity() {
  await requirePermission("opportunity:manage", "/admin/opportunities/new");
  return (
    <div>
      <p className="mb-3 text-sm"><Link href="/admin/opportunities" className="underline">← Opportunities</Link></p>
      <PageHeader title="New opportunity" description="Created as a DEMO draft. It stays visibly marked DEMO regardless of publication state." />
      <Alert tone="warn" className="mb-6" title="Do not enter real programme details here yet">Real programmes need verified details, approved terms and an explicit verification step before they can be LIVE.</Alert>
      <OpportunityEditor v={emptyEditorValues} />
    </div>
  );
}
