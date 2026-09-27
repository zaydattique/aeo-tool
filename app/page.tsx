export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">AEO Command</h1>
        <p className="text-lg text-muted-foreground">
          Answer Engine Optimization platform for agencies.
          Paste a client URL → prioritized Action Center → white-label report.
        </p>
        <p className="text-sm text-muted-foreground">
          Phase 1 scaffold is live. Full product under active development.
        </p>
      </div>
    </main>
  );
}
