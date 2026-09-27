import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "AEO Guides for Agencies",
  description:
    "Practical Answer Engine Optimization guides: AEO checklist, ChatGPT citations, Perplexity visibility, and how agency AEO tools differ from free checkers.",
  keywords: [
    "AEO guides",
    "Answer Engine Optimization guide",
    "AEO checklist",
    "ChatGPT citations",
    "Perplexity SEO",
    "AEO tools for agencies",
  ],
};

const GUIDES = [
  {
    href: "/aeo",
    title: "What is Answer Engine Optimization (AEO)?",
    blurb:
      "Definitions, AEO vs SEO, GEO, and why agencies need a delivery system — not a one-off score.",
  },
  {
    href: "/guides/aeo-checklist",
    title: "AEO checklist for agencies",
    blurb:
      "A practical punch-list you can run on every client: entity, structure, content, access, measurement.",
  },
  {
    href: "/guides/chatgpt-citations",
    title: "How to earn ChatGPT citations",
    blurb:
      "What makes a brand citable in ChatGPT-style answers and how agencies operationalize the work.",
  },
  {
    href: "/guides/perplexity-visibility",
    title: "Perplexity visibility for local and service brands",
    blurb:
      "How answer engines with visible citations change the game — and what to fix on client sites.",
  },
  {
    href: "/compare/aeo-tools",
    title: "AEO Command vs free AEO checkers",
    blurb:
      "Why a multi-tenant Action Center beats a public score page when you bill retainers.",
  },
];

export default function GuidesHubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">AEO guides</h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          Educational content for agencies delivering Answer Engine Optimization.
          Written to be clear for humans and structured for search and AI systems.
        </p>
        <ul className="mt-10 space-y-4">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="block rounded-xl border p-5 hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-foreground">{g.title}</span>
                <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-sm text-muted-foreground">
          Ready to run this on clients?{" "}
          <Link href="/signup" className="underline">
            Start a free trial of AEO Command
          </Link>
          .
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
