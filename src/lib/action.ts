import { ZodError } from "zod";
import { ForbiddenError, NotFoundError, ValidationError } from "./permissions";

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
  data?: Record<string, unknown>;
} | null;

/**
 * Runs a server-action body and converts known failures into a serializable state.
 * Unknown errors are logged server-side and replaced by a generic message so stack
 * traces / SQL details never reach the browser.
 */
export async function safeAction(fn: () => Promise<Partial<NonNullable<ActionState>> | void>): Promise<NonNullable<ActionState>> {
  try {
    const result = (await fn()) ?? {};
    return { ok: true, ...result };
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".") || "_form";
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
    }
    if (err instanceof ValidationError) return { ok: false, message: err.message, fieldErrors: err.fieldErrors };
    if (err instanceof ForbiddenError) return { ok: false, message: err.message };
    if (err instanceof NotFoundError) return { ok: false, message: err.message };
    console.error("[action error]", err);
    return { ok: false, message: "Something went wrong and your change was not saved. Please try again." };
  }
}

export function formString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}
export function formStrings(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === "string");
}
