import { minorToInputValue } from "./money";
import { dateInputValue } from "./format";
import type { OpportunityView } from "./services/opportunities";
import type { EditorValues } from "@/components/admin/opportunity-editor";

export const emptyEditorValues: EditorValues = {
  id: null, title: "", slug: "", shortDescription: "", description: "", category: "", classification: "DEMO", applicantTypes: [], eligibleRegions: [], keywords: "demo",
  fundingSpecified: false, currency: "USD", minAmount: "", maxAmount: "", fixedAmount: "", awardType: "", fundingPurpose: "", fundingTerms: "", plannedInstallments: "",
  installmentPlan: "", milestones: "", paymentSchedule: "", disbursementConditions: "", eligibilityCriteria: "", requiredInformation: "", requiredDocuments: "", opensAt: "", deadline: "",
  selectionProcess: "", decisionTimeline: "", programmeTerms: "", termsApproved: false, funderName: "", funderVerified: false, allowMultipleApplications: false, feePolicyNote: "", faq: [], questions: [],
};

export function toEditorValues(o: OpportunityView): EditorValues {
  const m = (n: number | null) => (n == null ? "" : minorToInputValue(n, o.currency));
  return {
    id: o.id, title: o.title, slug: o.slug, shortDescription: o.shortDescription, description: o.description, category: o.category, classification: o.classification,
    applicantTypes: o.applicantTypeList, eligibleRegions: o.regionList, keywords: o.keywordList.join(", "), fundingSpecified: o.fundingSpecified, currency: o.currency,
    minAmount: m(o.minAmountMinor), maxAmount: m(o.maxAmountMinor), fixedAmount: m(o.fixedAmountMinor), awardType: o.awardType ?? "", fundingPurpose: o.fundingPurpose ?? "",
    fundingTerms: o.fundingTerms ?? "", plannedInstallments: o.plannedInstallments?.toString() ?? "", installmentPlan: o.installmentPlan ?? "", milestones: o.milestones ?? "",
    paymentSchedule: o.paymentSchedule ?? "", disbursementConditions: o.disbursementConditions ?? "", eligibilityCriteria: o.criteria.join("\n"), requiredInformation: o.requiredInfo.join("\n"),
    requiredDocuments: o.requiredDocs.join("\n"), opensAt: dateInputValue(o.opensAt), deadline: dateInputValue(o.deadline), selectionProcess: o.selectionProcess ?? "",
    decisionTimeline: o.decisionTimeline ?? "", programmeTerms: o.programmeTerms ?? "", termsApproved: o.termsApproved, funderName: o.funderName ?? "", funderVerified: o.funderVerified,
    allowMultipleApplications: o.allowMultipleApplications, feePolicyNote: o.feePolicyNote ?? "", faq: o.faqList,
    questions: o.questions.map((q) => ({ key: q.key, label: q.label, helpText: q.helpText ?? "", type: q.type, options: q.optionList.join(", "), required: q.required, section: q.section })),
  };
}
