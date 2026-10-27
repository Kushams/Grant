import type { Metadata } from "next";
import Link from "next/link";
import { Award } from "lucide-react";
import { requireApplicant } from "@/lib/auth/session";
import { listApplicantAwards } from "@/lib/services/awards";
import { AwardPanel } from "@/components/dashboard/award-panel";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Awards and payments" };

export default async function AwardsPage() {
  const user = await requireApplicant("/dashboard/awards");
  const awards = await listApplicantAwards({ id: user.id, role: user.role, name: user.name });
  return (
    <div>
      <PageHeader title="Awards & payments" description="Award records linked to your own approved applications." />
      {awards.length === 0 ? <EmptyState icon={<Award className="size-8" />} title="There are no award records associated with your account." description="Awards only appear after an application is approved and staff record the terms. Applying never guarantees funding." />
        : <div className="space-y-6">{awards.map((a) => (
          <Card key={a.id}><CardHeader title={`${a.application.opportunity.title}`} description={<>Application <Link className="underline" href={`/dashboard/applications/${a.application.id}`}>{a.application.reference}</Link></>} /><CardBody><AwardPanel award={a} /></CardBody></Card>))}</div>}
    </div>
  );
}
