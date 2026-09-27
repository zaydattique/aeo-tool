import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "How to Earn ChatGPT Citations (AEO Guide)",
  description:
    "Practical guide for agencies on earning brand mentions and citable source status in ChatGPT-style answers: entity clarity, factual content, structure, and measurement.",
  keywords: [
    "ChatGPT citations",
    "optimize for ChatGPT",
    "ChatGPT SEO",
    "AEO ChatGPT",
    "get cited by ChatGPT",
  ],
};

const faq = [
  {
    q: "Can you guarantee ChatGPT citations?",
    a: "No ethical tool can guarantee citations. Models and retrieval change. Agencies should sell process and improvement — scans, fixes, tracking — not impossible guarantees.",
  },
  {
    q: "Is ChatGPT optimization the same as Google SEO?",
    a: "Overlapping foundations (crawlable, authoritative, clear content) matter for both. ChatGPT-oriented work adds emphasis on answerable specificity, entity consistency, and monitoring prompt-level presence.",
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

export default function ChatgptCitationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-medium text-primary">Guide</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">
          How to earn ChatGPT citations
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          ChatGPT and similar assistants synthesize answers. Sometimes they name
          brands or surface sources. Answer Engine Optimization (AEO) is the
          discipline of becoming a safe, clear, quotable option when those systems
          form a response.
        </p>

        <h2 className="text-xl font-semibold mt-10">What “citation” means in practice</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Depending on the product UI, users may see linked sources, named brands
          in prose, or both. Your job is not to hack a single ranking factor. It
          is to make the brand’s facts easy to retrieve and hard to confuse with
          competitors.
        </p>

        <h2 className="text-xl font-semibold mt-8">Levers agencies can actually work</h2>
        <ol className="mt-3 space-y-3 text-sm text-muted-foreground list-decimal pl-5">
          <li>
            <strong className="text-foreground">Entity disambiguation</strong> —
            one clear story of who the client is, what they sell, and where.
          </li>
          <li>
            <strong className="text-foreground">Citable specificity</strong> —
            numbers, processes, constraints, and unique offerings models can
            reuse without hallucinating.
          </li>
          <li>
            <strong className="text-foreground">Structured evidence</strong> —
            schema, FAQs, well-titled pages that match how people ask.
          </li>
          <li>
            <strong className="text-foreground">Corroboration</strong> — consistent
            presence on the open web so the brand is not a single orphan page.
          </li>
          <li>
            <strong className="text-foreground">Measurement</strong> — a fixed set
            of prompts re-checked over time (see visibility tracking in{" "}
            <Link href="/product" className="underline">
              AEO Command
            </Link>
            ).
          </li>
        </ol>

        <h2 className="text-xl font-semibold mt-8">What not to promise clients</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Do not sell “#1 in ChatGPT.” Sell a managed AEO program: audit, Action
          Center, implementation support, and reporting. Use the{" "}
          <Link href="/guides/aeo-checklist" className="underline">
            AEO checklist
          </Link>{" "}
          as the shared definition of done.
        </p>

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

        <div className="mt-12 rounded-xl border p-6 text-center">
          <Link
            href="/signup"
            className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Track prompts in AEO Command
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
