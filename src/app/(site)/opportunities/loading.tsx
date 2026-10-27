export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12" role="status" aria-live="polite">
      <div className="h-10 w-72 animate-pulse rounded bg-ink-100" />
      <div className="mt-6 h-56 animate-pulse rounded-xl bg-ink-100" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-ink-100" />)}</div>
      <span className="sr-only">Loading opportunities…</span>
    </div>
  );
}
