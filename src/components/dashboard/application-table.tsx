import Link from "next/link";
import { DemoBadge, StatusBadge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { buttonClasses } from "@/components/ui/button";

type Row = {
  id: string; reference: string | null; status: string; submittedAt: Date | null; updatedAt: Date;
  opportunity: { title: string; classification: string };
  organization?: { name: string } | null;
};

export function ApplicationTable({ rows }: { rows: Row[] }) {
  return (
    <TableWrap label="Your applications">
      <Table>
        <thead><tr><Th>Reference</Th><Th>Opportunity</Th><Th>Submitted</Th><Th>Status</Th><Th>Last updated</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
        <tbody>
          {rows.map((a) => {
            const editable = a.status === "DRAFT" || a.status === "RESUBMISSION_REQUIRED";
            return (
              <tr key={a.id}>
                <Td className="whitespace-nowrap font-semibold">{a.reference ?? <span className="font-normal italic text-ink-600">Draft — no reference yet</span>}</Td>
                <Td className="min-w-56"><span className="font-medium text-ink-900">{a.opportunity.title}</span>{a.organization ? <span className="block text-xs text-ink-600">for {a.organization.name}</span> : null}{a.opportunity.classification === "DEMO" ? <span className="mt-1 block"><DemoBadge compact /></span> : null}</Td>
                <Td className="whitespace-nowrap">{formatDate(a.submittedAt)}</Td>
                <Td><StatusBadge status={a.status} /></Td>
                <Td className="whitespace-nowrap">{formatDate(a.updatedAt)}</Td>
                <Td className="whitespace-nowrap text-right">
                  {editable ? <Link className={buttonClasses("accent", "sm")} href={`/dashboard/applications/${a.id}/edit`}>{a.status === "DRAFT" ? "Continue" : "Edit & resubmit"}</Link>
                    : <Link className={buttonClasses("outline", "sm")} href={`/dashboard/applications/${a.id}`}>Track<span className="sr-only"> {a.reference}</span></Link>}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );
}
