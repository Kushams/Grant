"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth/session";
import { safeAction, formString, formStrings, type ActionState } from "@/lib/action";
import { linesToList } from "@/lib/validation/common";
import { saveOpportunity, setOpportunityStatus, verifyAndMarkLive } from "@/lib/services/opportunities";
import { addReviewNote, assignReviewer, decide, moveStatus, recommend, requestInformation, requestRevision } from "@/lib/services/review";
import { changeAwardAmount, changeDisbursementStatus, createAward, createDisbursement, updateAward, updateDisbursement } from "@/lib/services/awards";
import { addSupportNote, updateSupportStatus } from "@/lib/services/support";
import { changeStaffRole, createStaffUser, setUserActive } from "@/lib/services/users";

const bool = (fd: FormData, k: string) => fd.get(k) === "on";

function parseOpportunityForm(fd: FormData) {
  let questions: unknown = [];
  let faq: unknown = [];
  try { questions = JSON.parse(formString(fd, "questions") || "[]"); } catch { questions = "invalid"; }
  try { faq = JSON.parse(formString(fd, "faq") || "[]"); } catch { faq = "invalid"; }
  return {
    title: formString(fd, "title"), slug: formString(fd, "slug") || undefined, shortDescription: formString(fd, "shortDescription"),
    description: formString(fd, "description"), category: formString(fd, "category"),
    applicantTypes: formStrings(fd, "applicantTypes"), eligibleRegions: formStrings(fd, "eligibleRegions"),
    keywords: formString(fd, "keywords").split(",").map((s) => s.trim()).filter(Boolean),
    fundingSpecified: bool(fd, "fundingSpecified"), currency: formString(fd, "currency") || "USD",
    minAmount: formString(fd, "minAmount"), maxAmount: formString(fd, "maxAmount"), fixedAmount: formString(fd, "fixedAmount"),
    awardType: formString(fd, "awardType") || undefined, fundingPurpose: formString(fd, "fundingPurpose"), fundingTerms: formString(fd, "fundingTerms"),
    plannedInstallments: formString(fd, "plannedInstallments"), installmentPlan: formString(fd, "installmentPlan"), milestones: formString(fd, "milestones"),
    paymentSchedule: formString(fd, "paymentSchedule"), disbursementConditions: formString(fd, "disbursementConditions"),
    eligibilityCriteria: linesToList(formString(fd, "eligibilityCriteria")), requiredInformation: linesToList(formString(fd, "requiredInformation")),
    requiredDocuments: linesToList(formString(fd, "requiredDocuments")),
    opensAt: formString(fd, "opensAt"), deadline: formString(fd, "deadline"),
    selectionProcess: formString(fd, "selectionProcess"), decisionTimeline: formString(fd, "decisionTimeline"),
    programmeTerms: formString(fd, "programmeTerms"), termsApproved: bool(fd, "termsApproved"),
    funderName: formString(fd, "funderName"), funderVerified: bool(fd, "funderVerified"),
    faq, allowMultipleApplications: bool(fd, "allowMultipleApplications"), feePolicyNote: formString(fd, "feePolicyNote"), questions,
  };
}

export async function saveOpportunityAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = formString(fd, "id") || null;
  const res = await safeAction(async () => {
    const actor = await getActor();
    const r = await saveOpportunity(actor, id, parseOpportunityForm(fd), "DEMO");
    revalidatePath("/admin/opportunities");
    return { redirectTo: id ? undefined : `/admin/opportunities/${r.id}?created=1`, message: id ? (r.unpublished ? "Saved. Because this verified LIVE opportunity changed materially, its verification was voided and it was unpublished." : "Opportunity saved.") : "Created.", data: { id: r.id } };
  });
  if (res.ok && res.redirectTo) redirect(res.redirectTo);
  return res;
}

export async function setOpportunityStatusAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await getActor();
    const to = formString(fd, "to") as "PUBLISHED" | "DRAFT" | "ARCHIVED";
    await setOpportunityStatus(actor, formString(fd, "id"), to);
    revalidatePath("/admin/opportunities");
    revalidatePath("/opportunities");
    return { message: to === "PUBLISHED" ? "Published." : to === "ARCHIVED" ? "Archived." : "Unpublished (now a draft)." };
  });
}

export async function verifyLiveAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await getActor();
    await verifyAndMarkLive(actor, formString(fd, "id"), { confirm: bool(fd, "confirm"), note: formString(fd, "note") });
    revalidatePath("/admin/opportunities");
    return { message: "Verification recorded. This opportunity is now classified LIVE; you can publish it." };
  });
}

// ---- applications
type Op = (actor: Awaited<ReturnType<typeof getActor>>, appId: string, fd: FormData) => Promise<unknown>;
const appAction = (message: string, op: Op) => async (_p: ActionState, fd: FormData): Promise<ActionState> =>
  safeAction(async () => {
    const actor = await getActor();
    const appId = formString(fd, "applicationId");
    await op(actor, appId, fd);
    revalidatePath(`/admin/applications/${appId}`);
    revalidatePath("/admin/applications");
    return { message };
  });

export const assignAction = appAction("Reviewer assigned.", (a, id, fd) => assignReviewer(a, id, { reviewerId: formString(fd, "reviewerId") }));
export const noteAction = appAction("Internal note saved.", (a, id, fd) => addReviewNote(a, id, { body: formString(fd, "body") }));
export const requestInfoAction = appAction("Information request sent to the applicant.", (a, id, fd) => requestInformation(a, id, { message: formString(fd, "message") }));
export const requestRevisionAction = appAction("Revision requested; the applicant can now edit and resubmit.", (a, id, fd) => requestRevision(a, id, { message: formString(fd, "message") }));
export const moveStatusAction = appAction("Status updated.", (a, id, fd) => moveStatus(a, id, { to: formString(fd, "to"), note: formString(fd, "note") }));
export const recommendAction = appAction("Recommendation recorded.", (a, id, fd) => recommend(a, id, { recommendation: formString(fd, "recommendation"), body: formString(fd, "body") }));
export const decideAction = appAction("Final decision recorded.", (a, id, fd) => decide(a, id, { outcome: formString(fd, "outcome"), reason: formString(fd, "reason"), internalNotes: formString(fd, "internalNotes"), applicantMessage: formString(fd, "applicantMessage") }));

// ---- awards
export async function createAwardAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  let awardId: string | null = null;
  const res = await safeAction(async () => {
    const actor = await getActor();
    const a = await createAward(actor, {
      applicationId: formString(fd, "applicationId"), amount: formString(fd, "amount"), currency: formString(fd, "currency"),
      acceptanceStatus: formString(fd, "acceptanceStatus") || "NOT_REQUIRED", conditions: formString(fd, "conditions"),
      applicantSummary: formString(fd, "applicantSummary"), internalNotes: formString(fd, "internalNotes"),
    });
    awardId = a.id;
    revalidatePath("/admin/awards");
  });
  if (res.ok && awardId) redirect(`/admin/awards/${awardId}?created=1`);
  return res;
}

const awardAction = (message: string, op: (a: Awaited<ReturnType<typeof getActor>>, id: string, fd: FormData) => Promise<unknown>) =>
  async (_p: ActionState, fd: FormData): Promise<ActionState> =>
    safeAction(async () => {
      const actor = await getActor();
      const id = formString(fd, "id");
      await op(actor, id, fd);
      revalidatePath(`/admin/awards/${formString(fd, "awardId") || id}`);
      revalidatePath("/admin/awards");
      return { message };
    });

export const updateAwardAction = awardAction("Award updated and audited.", (a, id, fd) => updateAward(a, id, {
  status: formString(fd, "status"), acceptanceStatus: formString(fd, "acceptanceStatus"), conditions: formString(fd, "conditions"),
  applicantSummary: formString(fd, "applicantSummary"), internalNotes: formString(fd, "internalNotes"), reason: formString(fd, "reason"),
}));
export const changeAwardAmountAction = awardAction("Award amount changed and audited.", (a, id, fd) => changeAwardAmount(a, id, { amount: formString(fd, "amount"), reason: formString(fd, "reason") }));
export const createDisbursementAction = awardAction("Instalment scheduled.", (a, id, fd) => createDisbursement(a, {
  awardId: id, amount: formString(fd, "amount"), plannedDate: formString(fd, "plannedDate"), milestone: formString(fd, "milestone"),
  applicantNote: formString(fd, "applicantNote"), internalNotes: formString(fd, "internalNotes"),
}));
export const updateDisbursementAction = awardAction("Instalment updated and audited.", (a, id, fd) => updateDisbursement(a, id, {
  amount: formString(fd, "amount"), plannedDate: formString(fd, "plannedDate"), milestone: formString(fd, "milestone"),
  applicantNote: formString(fd, "applicantNote"), internalNotes: formString(fd, "internalNotes"), reason: formString(fd, "reason"),
}));
export const changeDisbursementStatusAction = awardAction("Status recorded (manual entry) and audited.", (a, id, fd) => changeDisbursementStatus(a, id, {
  to: formString(fd, "to"), reason: formString(fd, "reason"), acknowledgeManual: bool(fd, "acknowledgeManual"),
}));

// ---- support & users
export async function supportStatusAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await getActor();
    const id = formString(fd, "id");
    await updateSupportStatus(actor, id, { status: formString(fd, "status"), assignedToId: formString(fd, "assignedToId") });
    revalidatePath(`/admin/support/${id}`);
    return { message: "Support request updated." };
  });
}
export async function supportNoteAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await getActor();
    const id = formString(fd, "id");
    await addSupportNote(actor, id, { body: formString(fd, "body"), isInternal: formString(fd, "visibility") !== "public" });
    revalidatePath(`/admin/support/${id}`);
    return { message: formString(fd, "visibility") === "public" ? "Reply sent (visible to the requester in-app)." : "Internal note saved." };
  });
}
export async function createStaffAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await getActor();
    await createStaffUser(actor, { name: formString(fd, "name"), email: formString(fd, "email"), role: formString(fd, "role"), password: formString(fd, "password") });
    revalidatePath("/admin/users");
    return { message: "Staff account created." };
  });
}
export async function changeRoleAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await getActor();
    await changeStaffRole(actor, formString(fd, "id"), formString(fd, "role"));
    revalidatePath("/admin/users");
    return { message: "Role changed; that user's sessions were revoked." };
  });
}
export async function setActiveAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await getActor();
    await setUserActive(actor, formString(fd, "id"), formString(fd, "active") === "true");
    revalidatePath("/admin/users");
    return { message: "Account updated." };
  });
}
