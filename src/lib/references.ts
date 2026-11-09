import { randomInt } from "node:crypto";
import { ORG } from "@/config/organization";

// Unambiguous alphabet (no 0/O/1/I) for human-readable, hard-to-guess suffixes.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/**
 * Human-readable unique references such as `NEN-DEMO-2026-7KQ4MZ`.
 *
 * Why random instead of a counter: a "max(id)+1" counter races under concurrent
 * submissions. Here uniqueness is guaranteed by the DB UNIQUE index; callers retry on
 * a collision (see `withUniqueReference`). Entropy: 32^6 ≈ 1.07e9 per prefix/year.
 */
export function buildReference(kind: "APP" | "OPP" | "AWD" | "DSB" | "SUP", demo: boolean, now = new Date()): string {
  const year = now.getUTCFullYear();
  const mid = kind === "APP" ? (demo ? "DEMO" : "APP") : kind === "OPP" ? "OPP" : kind;
  const p = kind === "APP" ? `${ORG.referencePrefix}-${mid}-${year}` : `${ORG.referencePrefix}-${mid}${demo ? "-DEMO" : ""}-${year}`;
  return `${p}-${randomCode(6)}`;
}

export const REFERENCE_PATTERN = /^NEN-[A-Z]{3,4}(?:-DEMO)?-\d{4}-[A-Z2-9]{6}$/;
export function normalizeReference(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/** Retries `fn` with a fresh reference when the unique index rejects a collision (Prisma P2002). */
export async function withUniqueReference<T>(make: () => string, fn: (ref: string) => Promise<T>, attempts = 6): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn(make());
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr ?? new Error("Could not allocate a unique reference");
}
