import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "Product — AEO scan, Action Center, reports",
  description:
    "See how AEO Command works: website scan, prioritized Action Center, AI visibility tracking, team collaboration, and white-label client reports.",
};

const FEATURES = [
  {
    title: "Website AEO scan",
    body: "Paste any public client URL. We crawl key pages and signals (titles, structured data, content depth, llms.txt, and more), then score Answer Engine readiness.",
  },
  {
    title: "Prioritized Action Center",
    body: "Issues become tasks with priority, category, effort estimate, and suggested fix text. Assign to teammates and track status until done.",
  },
  {
    title: "Visibility prompts",
    body: "Track the questions buyers ask AI systems about your client’s brand and category. Record checks over time and watch the score trend.",
  },
  {
    title: "White-label reports",
    body: "Generate a live report link with your agency branding. Clients open one URL — print or save PDF from the browser.",
  },
  {
    title: "Multi-tenant by design",
    body: "Every client, scan, action, and report is scoped to the agency. Invite owners and members without leaking data across accounts.",
  },
  {
    title: "Billing that matches agencies",
    body: "Pakistan and international plan tiers, usage soft limits, and Stripe checkout when you are ready to charge cards.",
  },
];

export default function ProductPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight max-w-2xl">
          The agency workflow for Answer Engine Optimization
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Free tools give a one-off score. AEO Command is built for ongoing
          delivery: multi-client control, collaboration, and professional
          reporting — the gap agencies actually get paid to fill.
        </p>

        <ol className="mt-12 space-y-4 max-w-2xl">
          {[
            "Add client and paste their website URL",
            "Run scan — crawl + AI (or heuristic) analysis",
            "Work the Action Center — assign, copy fixes, close tasks",
            "Track visibility prompts and generate a white-label report",
          ].map((step, i) => (
            <li key={step} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border p-6">
              <h2 className="font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl bg-slate-900 text-white p-8 text-center">
          <h2 className="text-xl font-semibold">Ready to run a client?</h2>
          <p className="mt-2 text-sm text-slate-300">
            Start a free trial — no credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block mt-5 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-slate-900"
          >
            Start free trial
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
