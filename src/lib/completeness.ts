/** Pure (client + server) completeness check for an application against its opportunity's questions. */
import { validateAnswer } from "./validation/application";

export type CompletenessQuestion = { key: string; label: string; type: string; optionList: string[]; required: boolean; section: string };
export type CompletenessOpp = {
  questions: CompletenessQuestion[];
  fundingSpecified: boolean;
  fixedAmountMinor: number | null;
  requireProposal: boolean;
};

export function stepForSection(section: string): number {
  return section === "GENERAL" ? 3 : section === "PROJECT" ? 4 : 5;
}

export function assessCompleteness(opp: CompletenessOpp, answers: Record<string, string>, extra: { requestedAmountMinor: number | null }) {
  const missing: Array<{ step: number; label: string }> = [];
  const invalid: Array<{ step: number; label: string; message: string }> = [];
  let required = 0;
  let answered = 0;
  for (const q of opp.questions) {
    const v = answers[q.key] ?? "";
    if (q.required) {
      required++;
      if (v !== "" && v !== "[]") answered++;
      else missing.push({ step: stepForSection(q.section), label: q.label });
    }
    const err = validateAnswer({ ...q, options: q.optionList }, v, false);
    if (err) invalid.push({ step: stepForSection(q.section), label: q.label, message: err });
  }
  // A requested amount is required when a proposal is required and the funding is a range (not fixed).
  if (opp.fundingSpecified && opp.fixedAmountMinor == null && opp.requireProposal) {
    required++;
    if (extra.requestedAmountMinor != null) answered++;
    else missing.push({ step: 4, label: "Requested amount" });
  }
  const percent = required === 0 ? 100 : Math.round((answered / required) * 100);
  return { missing, invalid, percent, required, answered };
}
