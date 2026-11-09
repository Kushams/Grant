export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16" role="status" aria-live="polite">
      <div className="h-8 w-64 animate-pulse rounded bg-ink-100" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-ink-100" />)}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
