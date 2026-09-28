import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <MarketingNav />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center">
          <p className="text-sm font-medium text-primary mb-3">
            Answer Engine Optimization software for agencies
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
            Rank in ChatGPT, Perplexity & AI answers — not just Google
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            AEO Command is the multi-tenant Answer Engine Optimization platform
            built by Threezero Agency for marketing agencies: paste a client URL,
            get a prioritized Action Center with exact steps, track AI visibility,
            and deliver white-label reports clients actually open.
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
            No credit card required · Pakistan & International pricing ·{" "}
            <Link href="/aeo" className="underline">
              What is AEO?
            </Link>
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Scan → Action Center",
              body: "Crawl the site, score AEO readiness, and turn findings into assignable tasks with suggested fixes — not vague SEO advice.",
              href: "/product",
            },
            {
              title: "Multi-client control",
              body: "One login for the whole agency. Isolate every client with agencyId tenancy, invite your team, track status, never mix data.",
              href: "/product",
            },
            {
              title: "White-label reports",
              body: "Live shareable links with your agency brand. Clients see professional delivery; you keep the margin on the retainer.",
              href: "/pricing",
            },
          ].map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="rounded-xl border bg-white p-6 shadow-sm hover:border-primary/40 transition-colors text-left"
            >
              <h2 className="font-semibold">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </Link>
          ))}
        </section>

        <section className="bg-slate-900 text-white py-16">
          <div className="mx-auto max-w-6xl px-4 grid gap-10 sm:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-bold">Why agencies need AEO tools now</h2>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Buyers increasingly ask AI systems — ChatGPT, Perplexity, Gemini,
                Claude — before they click a blue link. If your client is not
                cited in those answers, classic SEO alone is not enough. AEO
                Command turns that channel into a repeatable agency workflow:
                scan, prioritize, assign, report.
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm">
                <Link href="/aeo" className="underline underline-offset-4">
                  What is Answer Engine Optimization?
                </Link>
                <Link
                  href="/compare/aeo-tools"
                  className="underline underline-offset-4"
                >
                  vs free AEO checkers
                </Link>
                <Link href="/guides" className="underline underline-offset-4">
                  Agency guides
                </Link>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="rounded-lg bg-white/10 px-4 py-3">
                Prioritized fixes agents can assign this week
              </li>
              <li className="rounded-lg bg-white/10 px-4 py-3">
                Visibility prompts tracked over time
              </li>
              <li className="rounded-lg bg-white/10 px-4 py-3">
                Reports clients understand without an SEO dictionary
              </li>
              <li className="rounded-lg bg-white/10 px-4 py-3">
                Built multi-tenant from day one — not a single-site hack
              </li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-xl font-bold text-center">Learn the craft</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground max-w-xl mx-auto">
            Structured guides written for humans and for AI systems that need
            clear entity and process definitions.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
            <Link
              href="/guides/aeo-checklist"
              className="rounded-lg border p-4 hover:bg-slate-50"
            >
              <span className="font-medium">AEO checklist</span>
              <p className="mt-1 text-muted-foreground">
                Entity, structure, content, access, measurement.
              </p>
            </Link>
            <Link
              href="/guides/chatgpt-citations"
              className="rounded-lg border p-4 hover:bg-slate-50"
            >
              <span className="font-medium">ChatGPT citations</span>
              <p className="mt-1 text-muted-foreground">
                How agencies operationalize citable content.
              </p>
            </Link>
            <Link
              href="/guides/perplexity-visibility"
              className="rounded-lg border p-4 hover:bg-slate-50"
            >
              <span className="font-medium">Perplexity visibility</span>
              <p className="mt-1 text-muted-foreground">
                Citation-heavy engines and local service brands.
              </p>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 text-center">
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
