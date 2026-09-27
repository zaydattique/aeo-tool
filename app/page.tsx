import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center">
          <p className="text-sm font-medium text-primary mb-3">
            Answer Engine Optimization for agencies
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
            Rank in ChatGPT, Perplexity & AI answers — not just Google
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            AEO Command is the multi-tenant platform built for agencies: paste a
            client URL, get a prioritized Action Center with exact steps, track
            AI visibility, and deliver white-label reports clients actually open.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Start 14-day free trial
            </Link>
            <Link
              href="/product"
              className="rounded-md border bg-white px-6 py-3 text-sm font-medium hover:bg-gray-50"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Pakistan & International pricing
          </p>
        </section>

        {/* Value props */}
        <section className="mx-auto max-w-6xl px-4 pb-20 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Scan → Action Center",
              body: "Crawl the site, score AEO readiness, and turn findings into assignable tasks with suggested fixes — not vague SEO advice.",
            },
            {
              title: "Multi-client control",
              body: "One login for the whole agency. Isolate every client, invite your team, track status, and never mix tenant data.",
            },
            {
              title: "White-label reports",
              body: "Live shareable links with your logo and colors. Clients see professional delivery; you keep the margin.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="font-semibold">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </section>

        {/* Why AEO */}
        <section className="bg-slate-900 text-white py-16">
          <div className="mx-auto max-w-6xl px-4 grid gap-10 sm:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-bold">Why agencies need AEO tools now</h2>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Buyers increasingly ask AI systems — ChatGPT, Perplexity, Gemini,
                Claude — before they click a blue link. If your client is not
                cited in those answers, classic SEO alone is not enough. AEO
                Command turns that new channel into a repeatable agency workflow.
              </p>
              <Link
                href="/aeo"
                className="inline-block mt-5 text-sm underline underline-offset-4"
              >
                Read: What is Answer Engine Optimization?
              </Link>
            </div>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="rounded-lg bg-white/10 px-4 py-3">
                Prioritized fixes agents can assign this week
              </li>
              <li className="rounded-lg bg-white/10 px-4 py-3">
                Visibility prompts tracked over time
              </li>
              <li className="rounded-lg bg-white/10 px-4 py-3">
                Reports clients understand without a SEO dictionary
              </li>
              <li className="rounded-lg bg-white/10 px-4 py-3">
                Built multi-tenant from day one — not a single-site hack
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-2xl font-bold">Run your first client scan today</h2>
          <p className="mt-2 text-muted-foreground text-sm max-w-lg mx-auto">
            Free trial includes scans, Action Center, visibility tracking, and
            white-label reports. Upgrade when you are ready — PK & international
            plans.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              Create agency account
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border px-6 py-3 text-sm font-medium hover:bg-gray-50"
            >
              View pricing
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
