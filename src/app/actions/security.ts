"use server";

import { revalidatePath } from "next/cache";
import { safeAction, formString, type ActionState } from "@/lib/action";
import { getActor } from "@/lib/auth/session";
import { issueAccessCode, revokeAccessCode } from "@/lib/services/quick-access";
import { removePasskey } from "@/lib/services/passkeys";

export async function issueAccessCodeAction(): Promise<ActionState> {
  return safeAction(async () => {
    const code = await issueAccessCode(await getActor());
    revalidatePath("/dashboard/security");
    return { data: { code }, message: "New access code created. Your old code no longer works." };
  });
}

export async function revokeAccessCodeAction(): Promise<ActionState> {
  return safeAction(async () => {
    await revokeAccessCode(await getActor());
    revalidatePath("/dashboard/security");
    return { message: "Access code removed." };
  });
}

export async function removePasskeyAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safeAction(async () => {
    await removePasskey(await getActor(), formString(fd, "id"));
    revalidatePath("/dashboard/security");
    return { message: "Passkey removed." };
  });
}
