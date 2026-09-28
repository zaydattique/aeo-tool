import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "Perplexity Visibility Guide for Brands & Agencies",
  description:
    "How agencies improve Perplexity and citation-style answer engine visibility: source-worthy pages, local and service entity clarity, corroboration, and ongoing prompt tracking.",
  keywords: [
    "Perplexity SEO",
    "Perplexity visibility",
    "Perplexity citations",
    "AEO Perplexity",
    "optimize for Perplexity",
  ],
  alternates: { canonical: "/guides/perplexity-visibility" },
};

const faq = [
  {
    q: "Why does Perplexity visibility matter for agencies?",
    a: "Perplexity and similar engines often show sources next to the answer. Clients notice when competitors appear as sources and they do not. Classic rank reports do not explain that gap.",
  },
  {
    q: "What makes a page source-worthy?",
    a: "A clear claim, specific evidence, stable URL, crawlable HTML, and enough factual density that a model can quote without inventing missing details. Thin brochure pages rarely win.",
  },
  {
    q: "How do local service brands improve Perplexity visibility?",
    a: "State city, category, and offering without forcing the model to guess; keep NAP and entity names consistent; corroborate with directories and profiles that match the site.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Perplexity Visibility Guide for Brands & Agencies",
  description:
    "How agencies improve Perplexity and citation-style answer engine visibility.",
  author: { "@type": "Organization", name: "Threezero Agency", url: "https://threezero.agency" },
  publisher: { "@type": "Organization", name: "Threezero Agency", url: "https://threezero.agency" },
  datePublished: "2026-09-27",
  dateModified: "2026-09-28",
};

export default function PerplexityVisibilityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-medium text-primary">Guide</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">
          Perplexity visibility for service and local brands
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Perplexity and similar answer engines often show sources next to the
          answer. That makes citation-worthiness visible to the user — and makes
          weak, vague, or uncrawlable sites easy to skip. Answer Engine
          Optimization (AEO) connects technical clarity and content specificity to
          those interfaces.
        </p>

        <h2 className="text-xl font-semibold mt-10">Why this matters for agencies</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Clients notice when competitors appear as sources and they do not.
          Classic rank reports do not explain that gap. AEO work connects crawl
          access, entity clarity, and source-shaped pages to the products clients
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

        <h2 className="text-xl font-semibold mt-8">FAQ</h2>
        <div className="mt-4 space-y-6">
          {faq.map((f) => (
            <div key={f.q}>
              <h3 className="font-medium text-sm">{f.q}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>

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
