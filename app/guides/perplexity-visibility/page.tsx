import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "Perplexity Visibility Guide for Brands & Agencies",
  description:
    "How agencies improve Perplexity and citation-style answer engine visibility: source-worthy pages, local/service clarity, and ongoing prompt tracking.",
  keywords: [
    "Perplexity SEO",
    "Perplexity visibility",
    "Perplexity citations",
    "AEO Perplexity",
    "optimize for Perplexity",
  ],
};

export default function PerplexityVisibilityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-medium text-primary">Guide</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">
          Perplexity visibility for service and local brands
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Perplexity and similar answer engines often show sources next to the
          answer. That makes citation-worthiness visible to the user — and makes
          weak, vague, or uncrawlable sites easy to skip.
        </p>

        <h2 className="text-xl font-semibold mt-10">Why this matters for agencies</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Clients notice when competitors appear as sources and they do not.
          Classic rank reports do not explain that gap. AEO work connects
          technical clarity and content specificity to the interfaces clients
          actually use when researching vendors.
        </p>

        <h2 className="text-xl font-semibold mt-8">Practical focus areas</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>
            <strong className="text-foreground">Source-shaped pages</strong> —
            each money page should stand alone as a useful citation: clear claim,
            evidence, date freshness where relevant.
          </li>
          <li>
            <strong className="text-foreground">Local and service disambiguation</strong>{" "}
            — city, category, and offering stated without forcing the model to
            guess.
          </li>
          <li>
            <strong className="text-foreground">Corroborating footprint</strong> —
            directories, profiles, and articles that match the site’s entity story.
          </li>
          <li>
            <strong className="text-foreground">Prompt monitoring</strong> — fix a
            list of category and brand questions; re-test after major content
            ships. AEO Command’s visibility prompts support that loop.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">Related reading</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/aeo" className="underline">
              What is AEO?
            </Link>
          </li>
          <li>
            <Link href="/guides/chatgpt-citations" className="underline">
              ChatGPT citations
            </Link>
          </li>
          <li>
            <Link href="/guides/aeo-checklist" className="underline">
              Agency AEO checklist
            </Link>
          </li>
          <li>
            <Link href="/compare/aeo-tools" className="underline">
              AEO tools compared
            </Link>
          </li>
        </ul>

        <div className="mt-12 rounded-xl border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Turn Perplexity-oriented gaps into assigned tasks.
          </p>
          <Link
            href="/signup"
            className="inline-block mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Start free trial
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
