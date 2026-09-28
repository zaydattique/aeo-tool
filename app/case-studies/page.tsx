import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "AEO Case Studies",
  description:
    "How agencies use AEO Command to turn Answer Engine Optimization into retainers: scans, Action Center delivery, and white-label reports.",
  keywords: ["AEO case study", "Answer Engine Optimization examples", "agency AEO results"],
};

const STUDIES = [
  {
    slug: "regional-dental-group",
    title: "Regional dental group: from zero AI mentions to structured citations",
    sector: "Healthcare",
    summary:
      "A 6-location dental brand had strong Google rankings but almost no presence in AI answers. The agency used AEO Command to ship schema, FAQ, and entity fixes in two sprints.",
    outcomes: [
      "18 Action Center tasks closed in 3 weeks",
      "Visibility prompts tracked weekly",
      "Client retained on monthly AEO add-on",
    ],
  },
  {
    slug: "b2b-saas-agency",
    title: "B2B SaaS: product pages that answer buyer questions",
    sector: "Software",
    summary:
      "Thin feature pages scored poorly on content depth. Scans prioritized FAQ schema and comparison-style content the team could assign to writers.",
    outcomes: [
      "Content and schema categories dominated HIGH priority",
      "White-label report used in QBR",
      "Expanded from 2 to 7 product URLs under management",
    ],
  },
  {
    slug: "multi-city-home-services",
    title: "Home services franchise: local entity clarity",
    sector: "Home services",
    summary:
      "Franchise pages mixed brand names and cities inconsistently. Entity and technical actions from AEO Command became the rollout checklist for 12 city sites.",
    outcomes: [
      "Standardized Organization/LocalBusiness patterns",
      "Team seats used for franchise ops + agency SEO",
      "Re-scan cadence planned per market",
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Case studies</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Illustrative agency delivery stories based on the AEO Command workflow.
          Figures are representative patterns, not guaranteed results — models and
          markets change.
        </p>
        <div className="mt-10 space-y-6">
          {STUDIES.map((s) => (
            <article key={s.slug} className="rounded-xl border p-6">
              <p className="text-xs font-medium text-primary">{s.sector}</p>
              <h2 className="text-lg font-semibold mt-1">{s.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {s.summary}
              </p>
              <ul className="mt-3 space-y-1 text-sm list-disc pl-5 text-muted-foreground">
                {s.outcomes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Want this workflow on your roster?{" "}
          <Link href="/signup" className="underline">
            Start a free trial
          </Link>{" "}
          or read the{" "}
          <Link href="/guides/aeo-checklist" className="underline">
            AEO checklist
          </Link>
          .
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
