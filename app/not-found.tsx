import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm" aria-labelledby="not-found-title">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">404</p>
        <h1 id="not-found-title" className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The page you requested does not exist or is no longer available.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-lg border px-4 py-2 text-sm font-medium">Go home</Link>
          <Link href="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Open dashboard</Link>
        </div>
      </section>
    </main>
  );
}
