import { formatMinor } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { summarizeAward } from "@/lib/awards-calc";
import { DisbursementBadge } from "@/components/ui/badge";
import { Alert, DefinitionList } from "@/components/ui/misc";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { DISBURSEMENT_LABELS, type DisbursementStatus } from "@/lib/constants";

export type ApplicantAward = {
  reference: string; amountMinor: number; currency: string; status: string; acceptanceStatus: string; conditions: string | null; applicantSummary: string | null; approvedAt: Date;
  disbursements: Array<{ id: string; reference: string; amountMinor: number; currency: string; plannedDate: Date; milestone: string | null; status: string; applicantNote: string | null; updatedAt: Date }>;
};

const ACCEPT: Record<string, string> = { NOT_REQUIRED: "Not required", PENDING: "Awaiting acceptance", ACCEPTED: "Accepted", DECLINED: "Declined" };

export function AwardPanel({ award }: { award: ApplicantAward }) {
  const s = summarizeAward(award.amountMinor, award.disbursements);
  return (
    <div className="space-y-5">
      <Alert tone="info" title="What these records mean">
        Award and payment entries are administrative records made by authorized staff. National Empowerment Network’s website does not move money, and “paid” entries are manually recorded — they are not confirmations from a payment provider. You are never asked to pay anything to receive an award.
      </Alert>
      <DefinitionList items={[
        { label: "Award reference", value: award.reference },
        { label: "Approved amount", value: <strong>{formatMinor(award.amountMinor, award.currency)}</strong> },
        { label: "Award status", value: award.status.replace("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()) },
        { label: "Acceptance", value: ACCEPT[award.acceptanceStatus] ?? award.acceptanceStatus },
        { label: "Approved on", value: formatDate(award.approvedAt) },
        { label: "Recorded as paid so far", value: formatMinor(s.paidRecordedMinor, award.currency) },
        { label: "Remaining (not yet recorded as paid)", value: formatMinor(s.outstandingMinor, award.currency) },
        { label: "Not yet scheduled", value: s.unscheduledMinor > 0 ? `${formatMinor(s.unscheduledMinor, award.currency)} — no instalment planned yet` : "Fully scheduled" },
      ]} />
      {award.applicantSummary ? <p className="text-sm text-ink-800"><strong>Summary:</strong> {award.applicantSummary}</p> : null}
      {award.conditions ? <p className="text-sm text-ink-800"><strong>Conditions:</strong> {award.conditions}</p> : null}
      <div>
        <h3 className="mb-2 font-sans text-base font-bold tracking-normal text-navy-900">Planned instalments</h3>
        {award.disbursements.length === 0 ? <p className="text-sm text-ink-600">No instalments have been planned yet.</p> : (
          <TableWrap label="Planned instalments">
            <Table>
              <thead><tr><Th>Reference</Th><Th>Planned date</Th><Th>Amount</Th><Th>Recorded status</Th><Th>Note</Th></tr></thead>
              <tbody>
                {award.disbursements.map((d) => (
                  <tr key={d.id}>
                    <Td className="whitespace-nowrap font-medium">{d.reference}</Td>
                    <Td className="whitespace-nowrap">{formatDate(d.plannedDate)}</Td>
                    <Td className="whitespace-nowrap">{formatMinor(d.amountMinor, d.currency)}</Td>
                    <Td><DisbursementBadge status={d.status} />{d.status === "PAID_MANUAL" ? <span className="mt-1 block text-xs text-ink-600">Entered by staff; not provider-verified.</span> : null}<span className="sr-only">{DISBURSEMENT_LABELS[d.status as DisbursementStatus]}</span></Td>
                    <Td className="min-w-48">{[d.milestone, d.applicantNote].filter(Boolean).join(" — ") || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </div>
    </div>
  );
}
