"use client";

import { useEffect } from "react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Intentionally do not render or log the error object. Production error details stay server-side.
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm" role="alert" aria-labelledby="error-title">
        <p className="text-sm font-semibold uppercase tracking-wide text-destructive">Something went wrong</p>
        <h1 id="error-title" className="mt-2 text-3xl font-semibold">We could not complete that request</h1>
        <p className="mt-3 text-muted-foreground">No sensitive error details are shown here. Try again or return to a safe page.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={() => reset()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-lg border px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </section>
    </main>
  );
}
