import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "Product — AEO scan, Action Center, white-label reports",
  description:
    "AEO Command product: website AEO scan, prioritized Action Center, AI visibility tracking, multi-tenant agency isolation, team collaboration, and white-label client reports.",
  keywords: [
    "AEO tool for agencies",
    "agency AEO software",
    "white-label AEO report",
    "multi-client AEO",
    "Action Center AEO",
    "AI visibility tracking",
  ],
  alternates: { canonical: "/product" },
};

const FEATURES = [
  {
    title: "Website AEO scan",
    body: "Paste any public client URL. We crawl key pages and signals — titles, structured data, content depth, entity clarity, llms.txt hints — then score Answer Engine readiness so the team knows where to start.",
  },
  {
    title: "Prioritized Action Center",
    body: "Issues become tasks with priority, category, effort estimate, and suggested fix text. Assign to teammates and track status until done. This is the delivery layer free checkers omit.",
  },
  {
    title: "Visibility prompts",
    body: "Track the questions buyers ask AI systems about your client’s brand and category. Record checks over time and watch trends — not a one-shot score.",
  },
  {
    title: "White-label reports",
    body: "Generate a live report link with your agency branding. Clients open one URL; you keep professional delivery without exporting fragile PDFs as the only artifact.",
  },
  {
    title: "Multi-tenant by design",
    body: "Every client, scan, action, and report is scoped to the agency via agencyId. Invite owners and members without leaking data across accounts.",
  },
  {
    title: "Billing that matches agencies",
    body: "Pakistan and international plan tiers, usage soft limits, and Stripe checkout when you are ready to charge cards. 14-day free trial on every tier.",
  },
];

const faqs = [
  {
    q: "What is AEO Command?",
    a: "AEO Command is multi-tenant Answer Engine Optimization software for marketing agencies. It turns a client URL into a scan, an Action Center of assignable fixes, visibility prompt history, and a white-label live report.",
  },
  {
    q: "How is this different from free AEO checkers?",
    a: "Free checkers score one URL for curiosity. AEO Command isolates many clients, assigns work, tracks prompts over time, and brands the report for the agency. See the full comparison on /compare/aeo-tools.",
  },
  {
    q: "Who is AEO Command for?",
    a: "Agency owners and account teams managing multiple client domains — not single-site hobbyists alone. Roles include AGENCY_OWNER, AGENCY_MEMBER, and SUPER_ADMIN.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function ProductPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight max-w-2xl">
          The agency workflow for Answer Engine Optimization
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl text-sm leading-relaxed">
          AEO Command is multi-tenant SaaS built by Threezero Agency. Free tools
          give a one-off score. Agencies get paid for ongoing delivery:
          multi-client control, collaboration, and professional reporting — the
          gap AEO Command is designed to fill.
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

        <section className="mt-16 max-w-2xl">
          <h2 className="text-xl font-semibold">Built for agency economics</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Monitoring platforms help you see mentions. AEO Command helps you
            ship the week’s work and prove it. Pair product delivery with{" "}
            <Link href="/aeo" className="underline">
              what AEO is
            </Link>
            , the{" "}
            <Link href="/guides/aeo-checklist" className="underline">
              agency checklist
            </Link>
            , and{" "}
            <Link href="/pricing" className="underline">
              PK / international pricing
            </Link>
            .
          </p>
        </section>

        <section className="mt-12 max-w-2xl">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-4 space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-medium text-sm">{f.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

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
