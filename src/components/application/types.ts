export type WizardQuestion = {
  key: string; label: string; helpText: string | null; type: string; optionList: string[]; required: boolean; section: string;
};

export type WizardValues = {
  category: string;
  organizationId: string;
  answers: Record<string, string | string[]>;
  requestedAmount: string;
  consentAccepted: boolean;
  consentTerms: boolean;
};

export type WizardProps = {
  applicationId: string;
  reference: string | null;
  status: string;
  startStep: number;
  mode: "INDIVIDUAL" | "ORGANIZATION";
  category: string;
  organizationId: string;
  opportunity: {
    title: string; slug: string; reference: string; isDemo: boolean; currency: string;
    fundingSpecified: boolean; fixedAmountMinor: number | null; minAmountMinor: number | null; maxAmountMinor: number | null;
    fundingText: string | null; requireProposal: boolean; hasTerms: boolean; acceptedTypes: string[]; requiredDocs: string[]; requiredInfo: string[];
    questions: WizardQuestion[];
  };
  organizations: Array<{ id: string; name: string; type: string; country: string | null; contactEmail: string | null; ready: boolean }>;
  individual: { fullName: string; country: string | null; city: string | null; ready: boolean } | null;
  answers: Record<string, string>;
  requestedAmount: string;
  revisionNote: string | null;
};
