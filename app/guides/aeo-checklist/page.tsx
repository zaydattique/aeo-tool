import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "AEO Checklist for Agencies",
  description:
    "A practical Answer Engine Optimization checklist for agency teams: entity clarity, structure, content, technical access, measurement, and client reporting.",
  keywords: [
    "AEO checklist",
    "Answer Engine Optimization checklist",
    "AEO audit",
    "agency AEO process",
  ],
  alternates: { canonical: "/guides/aeo-checklist" },
};

const sections = [
  {
    title: "1. Entity & brand clarity",
    items: [
      "Homepage and About state who the business is in plain language",
      "Consistent legal/brand name across title, H1, schema, and footer",
      "Service area or niche is explicit (not only vague slogans)",
      "Logo and Organization/LocalBusiness schema where appropriate",
    ],
  },
  {
    title: "2. Question-shaped content",
    items: [
      "Key pages answer real buyer questions (who, what, where, pricing patterns, comparisons)",
      "FAQ blocks with specific, citable answers — not fluff",
      "Service pages have enough factual density for a model to quote",
      "Avoid thin pages that only list keywords",
    ],
  },
  {
    title: "3. Structure machines can parse",
    items: [
      "One clear H1; logical H2/H3 outline",
      "JSON-LD for Organization, WebSite, FAQ, Product/Service as relevant",
      "Clean internal links between services, locations, and proof pages",
      "llms.txt or clear machine-readable summary when useful",
    ],
  },
  {
    title: "4. Technical access",
    items: [
      "Important pages not blocked in robots.txt for Google or major AI bots",
      "Fast enough HTML response; critical content not trapped only in client JS",
      "Canonical URLs consistent; no accidental noindex on money pages",
      "HTTPS and stable URLs",
    ],
  },
  {
    title: "5. Proof & trust",
    items: [
      "Case studies, credentials, or reviews with concrete outcomes",
      "Contact and policy pages present",
      "Citations and brand mentions elsewhere support the entity",
    ],
  },
  {
    title: "6. Measurement & delivery",
    items: [
      "Define prompt set per client (category + brand + competitor questions)",
      "Re-check visibility on a schedule — not only at kickoff",
      "Turn gaps into assigned tasks (Action Center style)",
      "Report in client language with white-label output",
    ],
  },
];

const faq = [
  {
    q: "How often should agencies run an AEO checklist?",
    a: "At client kickoff, after major site launches, and at least quarterly. Re-scan faster when visibility prompts drop or competitors ship large content updates.",
  },
  {
    q: "Is this checklist the same as a free AEO score?",
    a: "No. A score is a snapshot. This checklist is a delivery definition of done that maps to assignable work, team ownership, and client reporting — the workflow AEO Command productizes.",
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

export default function AeoChecklistPage() {
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
          AEO checklist for agencies
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Use this Answer Engine Optimization checklist on every new client and
          every quarterly review. It is designed for delivery teams — not academic
          debate. Pair it with{" "}
          <Link href="/product" className="underline">
            AEO Command
          </Link>{" "}
          to turn checks into assigned work.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-5">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-12">How AEO Command maps to this list</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          A scan surfaces structural and content gaps. The Action Center is where
          checklist items become tickets. Visibility prompts cover measurement.
          White-label reports close the loop with the client. Free checkers stop
          at the first step — see{" "}
          <Link href="/compare/aeo-tools" className="underline">
            AEO tools compared
          </Link>
          .
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
            Run checklist via free trial
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
