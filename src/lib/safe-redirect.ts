/** Only same-site relative paths are honoured, preventing open redirects. */
export function safeNext(next: string | undefined | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\r\n\t]/.test(next)) return null;
  return next;
}
