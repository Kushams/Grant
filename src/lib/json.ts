/** Safe helpers for the JSON-encoded list columns. */
export function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function parseFaq(raw: string | null | undefined): Array<{ q: string; a: string }> {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => x && typeof x.q === "string" && typeof x.a === "string") : [];
  } catch {
    return [];
  }
}
export const toJson = (v: unknown): string => JSON.stringify(v);
