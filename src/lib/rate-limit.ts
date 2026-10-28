/**
 * Minimal in-memory sliding-window limiter used for sign-in attempts.
 *
 * LIMITATION (documented in README): state lives in this Node process, so it resets
 * on restart and is not shared between instances. Production should use a shared
 * store (Redis / the database / the edge provider's rate limiter).
 */
type Bucket = { fails: number[]; };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 6;

function prune(b: Bucket, now: number) {
  b.fails = b.fails.filter((t) => now - t < WINDOW_MS);
}

export function loginAllowed(key: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const b = buckets.get(key);
  if (!b) return { allowed: true, retryAfterSec: 0 };
  prune(b, now);
  if (b.fails.length < MAX_FAILS) return { allowed: true, retryAfterSec: 0 };
  const oldest = b.fails[0];
  return { allowed: false, retryAfterSec: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) };
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  const b = buckets.get(key) ?? { fails: [] };
  prune(b, now);
  b.fails.push(now);
  buckets.set(key, b);
}

export function clearLoginFailures(key: string): void {
  buckets.delete(key);
}

export function resetRateLimits(): void {
  buckets.clear();
}
