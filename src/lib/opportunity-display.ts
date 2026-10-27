import { formatMinor } from "./money";
import { deadlineLabel } from "./eligibility";
import { formatDate } from "./format";
import { APPLICANT_TYPE_LABELS, type ApplicantType } from "./constants";

type Funding = {
  fundingSpecified: boolean;
  currency: string;
  minAmountMinor: number | null;
  maxAmountMinor: number | null;
  fixedAmountMinor: number | null;
};

/** Returns null when no amount is configured, so callers render "to be confirmed" — never an invented figure. */
export function fundingLabel(o: Funding): string | null {
  if (!o.fundingSpecified) return null;
  if (o.fixedAmountMinor != null) return formatMinor(o.fixedAmountMinor, o.currency);
  if (o.minAmountMinor != null && o.maxAmountMinor != null) return `${formatMinor(o.minAmountMinor, o.currency)} – ${formatMinor(o.maxAmountMinor, o.currency).replace(`${o.currency} `, "")}`;
  if (o.maxAmountMinor != null) return `Up to ${formatMinor(o.maxAmountMinor, o.currency)}`;
  if (o.minAmountMinor != null) return `From ${formatMinor(o.minAmountMinor, o.currency)}`;
  return null;
}

export const applicantTypeLabel = (t: string) => APPLICANT_TYPE_LABELS[t as ApplicantType] ?? t;
export const deadlineText = (d: Date | null) => (d ? `${formatDate(d)} · ${deadlineLabel(d)}` : "Deadline to be confirmed");
