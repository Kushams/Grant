import type { ReactNode } from "react";
import { Alert, PageHeader } from "@/components/ui/misc";
import { ORG } from "@/config/organization";

export function ContentPage({ title, eyebrow, intro, children, draftPolicy = false, wide = false, icon }: { title: string; eyebrow?: string; intro?: string; children: ReactNode; draftPolicy?: boolean; wide?: boolean; icon?: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeader eyebrow={eyebrow} title={title} description={intro} icon={icon} />
      {draftPolicy ? (
        <Alert tone="warn" className="mb-8 max-w-3xl" title="Pending formal approval">
          This page is awaiting formal approval by {ORG.name} and legal review (version: {ORG.policyVersion}).
          Legal entity details, registration numbers, governing law, official addresses and privacy contacts are intentionally left blank until supplied and verified.
        </Alert>
      ) : null}
      <div className={wide ? "" : "prose-nen"}>{children}</div>
    </div>
  );
}
