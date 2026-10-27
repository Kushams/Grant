import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DEMO_LABEL } from "@/config/organization";
import { DISBURSEMENT_LABELS, STATUS_LABELS, type ApplicationStatus, type DisbursementStatus } from "@/lib/constants";

type Tone = "neutral" | "navy" | "teal" | "ok" | "warn" | "bad" | "info";
const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-800 border-ink-200",
  navy: "bg-navy-50 text-violet-300 border-navy-200",
  teal: "bg-teal-50 text-violet-300 border-teal-200",
  ok: "bg-ok-50 text-ok-700 border-ok-700/25",
  warn: "bg-warn-50 text-warn-700 border-warn-700/25",
  bad: "bg-bad-50 text-bad-700 border-bad-700/25",
  info: "bg-info-50 text-info-700 border-info-700/25",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

const statusTone: Record<ApplicationStatus, Tone> = {
  DRAFT: "neutral", SUBMITTED: "info", INITIAL_REVIEW: "info", UNDER_REVIEW: "info", INFO_REQUESTED: "warn", RESUBMISSION_REQUIRED: "warn",
  RECOMMENDED: "teal", APPROVED: "ok", DECLINED: "bad", WITHDRAWN: "neutral", AWARD_PROCESSING: "teal", DISBURSEMENT_SCHEDULED: "teal",
  PARTIALLY_DISBURSED: "teal", FULLY_DISBURSED: "ok", CLOSED: "neutral",
};
export function StatusBadge({ status }: { status: string }) {
  const s = status as ApplicationStatus;
  return <Badge tone={statusTone[s] ?? "neutral"}>{STATUS_LABELS[s] ?? status}</Badge>;
}

const dTone: Record<DisbursementStatus, Tone> = {
  NOT_SCHEDULED: "neutral", SCHEDULED: "info", AWAITING_PROCESSING: "info", PROCESSING_RECORDED: "teal", PAID_MANUAL: "ok",
  ON_HOLD: "warn", CANCELLED: "neutral", FAILED_MANUAL: "bad", RECONCILED: "ok",
};
export function DisbursementBadge({ status }: { status: string }) {
  const s = status as DisbursementStatus;
  return <Badge tone={dTone[s] ?? "neutral"}>{DISBURSEMENT_LABELS[s] ?? status}</Badge>;
}

/** Visible on every demo opportunity, regardless of publication state. */
export function DemoBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded border-2 border-warn-700/60 bg-warn-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-warn-700", className)}>
      {compact ? "DEMO" : DEMO_LABEL}
    </span>
  );
}

export function OpportunityStateBadge({ state }: { state: "OPEN" | "NOT_PUBLISHED" | "NOT_YET_OPEN" | "CLOSED" }) {
  if (state === "OPEN") return <Badge tone="ok">Open for applications</Badge>;
  if (state === "NOT_YET_OPEN") return <Badge tone="info">Opens soon</Badge>;
  if (state === "CLOSED") return <Badge tone="neutral">Closed</Badge>;
  return <Badge tone="warn">Not published</Badge>;
}
