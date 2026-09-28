import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "How to Earn ChatGPT Citations (AEO Guide)",
  description:
    "Practical agency guide to earning brand mentions and citable sources in ChatGPT-style answers: entity clarity, answer-first content, structured evidence, corroboration, and prompt measurement.",
  keywords: [
    "ChatGPT citations",
    "optimize for ChatGPT",
    "ChatGPT SEO",
    "AEO ChatGPT",
    "get cited by ChatGPT",
    "ChatGPT citation optimization",
  ],
  alternates: { canonical: "/guides/chatgpt-citations" },
};

const faq = [
  {
    q: "Can you guarantee ChatGPT citations?",
    a: "No ethical tool or agency can guarantee citations. Models and retrieval change. Agencies should sell process and improvement — scans, fixes, tracking — not impossible guarantees.",
  },
  {
    q: "Is ChatGPT optimization the same as Google SEO?",
    a: "Overlapping foundations matter for both: crawlable pages, authority, clear content. ChatGPT-oriented work adds answerable specificity, entity consistency, third-party corroboration, and monitoring prompt-level presence.",
  },
  {
    q: "What content format earns citations most often?",
    a: "Answer-first passages, specific facts (numbers, constraints, processes), FAQ pairs that match real questions, and pages that stand alone when extracted. Vague marketing copy is rarely quoted.",
  },
  {
    q: "How should agencies measure ChatGPT visibility?",
    a: "Fix a prompt set (brand, category, competitor questions), re-run on a schedule, log mention versus citation versus silence, and tie gaps to Action Center tasks. AEO Command supports that loop.",
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
  headline: "How to Earn ChatGPT Citations (AEO Guide)",
  description:
    "Practical agency guide to earning brand mentions and citable sources in ChatGPT-style answers.",
  author: { "@type": "Organization", name: "Threezero Agency", url: "https://threezero.agency" },
  publisher: { "@type": "Organization", name: "Threezero Agency", url: "https://threezero.agency" },
  datePublished: "2026-09-27",
  dateModified: "2026-09-28",
};

export default function ChatgptCitationsPage() {
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
          How to earn ChatGPT citations
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          ChatGPT and similar assistants synthesize answers. Sometimes they name
          brands or surface sources. Answer Engine Optimization (AEO) is how
          agencies make a client a safe, clear, quotable option when those systems
          form a response — not a guarantee of a fixed rank.
        </p>

        <h2 className="text-xl font-semibold mt-10">What “citation” means in practice</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Depending on the product UI, users may see linked sources, named brands
          in prose, or both. Your job is not to hack a single ranking factor. It
          is to make the brand’s facts easy to retrieve and hard to confuse with
          competitors. Mention rate and citation rate are different; track both.
        </p>

        <h2 className="text-xl font-semibold mt-8">Levers agencies can actually work</h2>
        <ol className="mt-3 space-y-3 text-sm text-muted-foreground list-decimal pl-5">
          <li>
            <strong className="text-foreground">Entity disambiguation</strong> —
            one clear story of who the client is, what they sell, and where, repeated
            consistently on-site and off-site.
          </li>
          <li>
            <strong className="text-foreground">Citable specificity</strong> —
            numbers, processes, constraints, and unique offerings models can
            reuse without inventing details.
          </li>
          <li>
            <strong className="text-foreground">Answer-first structure</strong> —
            lead sections with the fact; keep each block readable in isolation.
          </li>
          <li>
            <strong className="text-foreground">Structured evidence</strong> —
            schema and FAQs that match visible text and real buyer questions.
          </li>
          <li>
            <strong className="text-foreground">Corroboration</strong> — consistent
            presence on the open web so the brand is not a single orphan page.
          </li>
          <li>
            <strong className="text-foreground">Measurement</strong> — a fixed set
            of prompts re-checked over time (visibility tracking in{" "}
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
          as the shared definition of done, and read{" "}
          <Link href="/aeo" className="underline">
            what AEO is
          </Link>{" "}
          for framing.
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
