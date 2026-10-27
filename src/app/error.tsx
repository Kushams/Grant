"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center" role="alert">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-ink-600">An unexpected error occurred. Nothing you submitted was lost if you saw a confirmation earlier. Details are not shown for security reasons.</p>
      <div className="mt-6"><Button onClick={reset}>Try again</Button></div>
    </div>
  );
}
