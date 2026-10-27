const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export const formatDate = (d: Date | string | null | undefined): string => (d ? dateFmt.format(new Date(d)) : "—");
export const formatDateTime = (d: Date | string | null | undefined): string => (d ? `${dateTimeFmt.format(new Date(d))} UTC` : "—");
export const dateInputValue = (d: Date | null | undefined): string => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const pluralize = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Builds a query string from defined, non-empty params. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && String(v) !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
