import { APPLICANT_TYPES, CURRENCY_CODES, PROGRAMME_CATEGORIES, REGIONS } from "./constants";
import { parseAmountToMinor } from "./money";
import { SORTS, type SearchParams } from "./services/opportunities";

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/**
 * Validates directory filters from the URL. Unknown/invalid values are dropped (never trusted
 * or passed to the database) and reported so the UI can tell the user.
 */
export function parseDirectoryParams(raw: Raw): { params: SearchParams; ignored: string[] } {
  const ignored: string[] = [];
  const p: SearchParams = {};
  const q = one(raw.q);
  if (q) p.q = q.slice(0, 100);

  const pick = <T extends string>(key: string, allowed: readonly T[]): T | undefined => {
    const v = one(raw[key]);
    if (!v) return undefined;
    if ((allowed as readonly string[]).includes(v)) return v as T;
    ignored.push(key);
    return undefined;
  };
  p.applicantType = pick("applicantType", APPLICANT_TYPES);
  p.category = pick("category", PROGRAMME_CATEGORIES);
  p.region = pick("region", REGIONS);
  p.status = pick("status", ["open", "upcoming", "closed"] as const);
  p.deadline = pick("deadline", ["7", "30", "90", "none"] as const);
  p.sort = pick("sort", SORTS);

  const currency = pick("currency", CURRENCY_CODES);
  const minFunding = one(raw.minFunding);
  if (minFunding) {
    if (currency && parseAmountToMinor(minFunding, currency) !== null) {
      p.currency = currency;
      p.minFunding = minFunding;
    } else {
      ignored.push(currency ? "minFunding" : "currency");
    }
  } else if (currency) {
    p.currency = currency; // currency alone has no effect but is kept for the form
  }

  const page = Number(one(raw.page) ?? 1);
  p.page = Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1;
  if (one(raw.page) && p.page === 1 && one(raw.page) !== "1") ignored.push("page");
  return { params: p, ignored };
}
