"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <section role="alert" aria-labelledby="global-error-title" style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
            <p>Something went wrong</p>
            <h1 id="global-error-title">Threezero AEO could not load this page</h1>
            <p>Please try again. Detailed server errors are not exposed to the browser.</p>
            <button type="button" onClick={() => reset()}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
