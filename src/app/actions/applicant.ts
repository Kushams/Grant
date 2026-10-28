"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActor, getCurrentUser } from "@/lib/auth/session";
import { isPlaceholderEmail } from "@/lib/auth/access-code";
import { safeAction, formString, formStrings, type ActionState } from "@/lib/action";
import { isApplicantRole } from "@/lib/constants";
import { ForbiddenError } from "@/lib/permissions";
import { toggleSaved } from "@/lib/services/opportunities";
import {
  respondToInfoRequest, saveApplicationStep, startOrResumeApplication, submitApplication, withdrawApplication, type StepPayload,
} from "@/lib/services/applications";
import { updateIndividualProfile, updateOrganizationProfile } from "@/lib/services/users";
import { markAllRead, markRead } from "@/lib/services/notifications";
import { createSupportRequest } from "@/lib/services/support";
import { safeNext } from "@/lib/safe-redirect";

async function applicant() {
  const actor = await getActor();
  if (!isApplicantRole(actor.role)) throw new ForbiddenError("Only applicant accounts can do that.");
  return actor;
}

export async function toggleSavedAction(fd: FormData): Promise<void> {
  const actor = await applicant();
  await toggleSaved(actor.id, formString(fd, "opportunityId"));
  const back = safeNext(formString(fd, "back")) ?? "/dashboard/saved";
  revalidatePath(back);
  redirect(back);
}

export async function startApplicationAction(fd: FormData): Promise<void> {
  const slug = formString(fd, "slug");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/opportunities/${slug}`)}`);
  let id: string | null = null;
  let failure: string | null = null;
  const res = await safeAction(async () => {
    const actor = await applicant();
    const r = await startOrResumeApplication(actor, slug, formString(fd, "organizationId") || undefined);
    id = r.id;
  });
  if (!res.ok) failure = res.message ?? "Could not start the application.";
  if (id) redirect(`/dashboard/applications/${id}/edit`);
  redirect(`/opportunities/${slug}?apply_error=${encodeURIComponent(failure ?? "Could not start the application.")}`);
}

/** Called from the wizard. Returns a serializable result; never redirects. */
export async function saveStepAction(applicationId: string, step: number, nextStep: number, payload: StepPayload): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await applicant();
    const r = await saveApplicationStep(actor, applicationId, step, nextStep, payload);
    revalidatePath(`/dashboard/applications/${applicationId}/edit`);
    return { message: "Progress saved.", data: r };
  });
}

export async function submitApplicationAction(applicationId: string, consent: { consentAccepted: boolean; consentTerms: boolean }): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await applicant();
    const r = await submitApplication(actor, applicationId, consent);
    revalidatePath("/dashboard", "layout");
    return { message: `Submitted. Your reference is ${r.reference}.`, redirectTo: `/dashboard/applications/${applicationId}?submitted=1`, data: { reference: r.reference } };
  });
}

export async function withdrawAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = formString(fd, "applicationId");
  const res = await safeAction(async () => {
    const actor = await applicant();
    await withdrawApplication(actor, id, { reason: formString(fd, "reason") });
    revalidatePath("/dashboard", "layout");
    return { message: "Application withdrawn." };
  });
  return res;
}

export async function respondAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = formString(fd, "applicationId");
  return safeAction(async () => {
    const actor = await applicant();
    await respondToInfoRequest(actor, id, { body: formString(fd, "body") });
    revalidatePath(`/dashboard/applications/${id}`);
    return { message: "Your reply was sent to the review team." };
  });
}

export async function saveIndividualProfileAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await applicant();
    await updateIndividualProfile(actor.id, {
      fullName: formString(fd, "fullName"), country: formString(fd, "country"), city: formString(fd, "city"), phone: formString(fd, "phone"),
      applicantCategory: formString(fd, "applicantCategory"), background: formString(fd, "background"), interests: formStrings(fd, "interests"),
    });
    revalidatePath("/dashboard", "layout");
    return { message: "Profile saved." };
  });
}

export async function saveOrganizationProfileAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const actor = await applicant();
    await updateOrganizationProfile(actor.id, formString(fd, "organizationId"), {
      name: formString(fd, "name"), type: formString(fd, "type"), country: formString(fd, "country"), city: formString(fd, "city"),
      contactEmail: formString(fd, "contactEmail"), phone: formString(fd, "phone"), website: formString(fd, "website"),
      description: formString(fd, "description"), sectors: formStrings(fd, "sectors"),
    });
    revalidatePath("/dashboard", "layout");
    return { message: "Organization profile saved." };
  });
}

export async function markNotificationReadAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await markRead(user.id, formString(fd, "id"));
  const back = safeNext(formString(fd, "back")) ?? "/dashboard/notifications";
  revalidatePath(back);
  const href = safeNext(formString(fd, "href"));
  redirect(href ?? back);
}

export async function markAllNotificationsReadAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await markAllRead(user.id);
  const back = safeNext(formString(fd, "back")) ?? "/dashboard/notifications";
  revalidatePath(back);
  redirect(back);
}

export async function contactAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    const user = await getCurrentUser();
    const req = await createSupportRequest(
      {
        name: formString(fd, "name"), email: formString(fd, "email") || (user && isPlaceholderEmail(user.email) ? user.email : ""), topic: formString(fd, "topic"), relatedRef: formString(fd, "relatedRef"),
        message: formString(fd, "message"), consent: fd.get("consent") === "on", website: formString(fd, "website"),
      },
      user?.id ?? null,
    );
    return {
      message: `Thank you — your message was stored in our in-app support queue as ${req.reference}. No email or SMS has been sent, and replies appear in the support inbox${user ? " on your dashboard" : " for signed-in users only"}.`,
      data: { reference: req.reference },
    };
  });
}
