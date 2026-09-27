import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">AEO Command</h1>
        <p className="text-lg text-muted-foreground">
          Answer Engine Optimization platform for agencies.
          Paste a client URL → prioritized Action Center → white-label report.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/signup"
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Start free trial
          </Link>
          <Link
            href="/login"
            className="rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
