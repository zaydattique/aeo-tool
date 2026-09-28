import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = {
  title: "AEO Command vs Free AEO Checkers & Agency Trackers",
  description:
    "Compare free Answer Engine Optimization checkers and agency AI visibility trackers with AEO Command — multi-client Action Center, team assignment, visibility tracking, and white-label reports.",
  keywords: [
    "AEO tools",
    "best AEO tool",
    "AEO checker",
    "Answer Engine Optimization software",
    "AEO for agencies",
    "AEO Command",
    "white-label AEO report",
    "multi-client AEO tool",
  ],
  alternates: { canonical: "/compare/aeo-tools" },
};

const rows = [
  {
    label: "Primary user",
    free: "Curious marketer, one site",
    trackers: "Brand or agency analyst",
    ours: "Agency teams, many clients",
  },
  {
    label: "Output",
    free: "Score + generic tips",
    trackers: "Mentions, citations, charts",
    ours: "Prioritized Action Center with steps",
  },
  {
    label: "Collaboration",
    free: "None",
    trackers: "Often seats / shared dashboards",
    ours: "Assign, status, team seats",
  },
  {
    label: "Client delivery",
    free: "Screenshot or PDF if available",
    trackers: "Branded report on higher plans",
    ours: "White-label live report link",
  },
  {
    label: "Visibility over time",
    free: "Usually one-shot",
    trackers: "Strong prompt history",
    ours: "Tracked prompts + history",
  },
  {
    label: "Data isolation",
    free: "N/A or single account",
    trackers: "Varies by vendor",
    ours: "Multi-tenant agencyId isolation",
  },
  {
    label: "Fix workflow",
    free: "Advice only",
    trackers: "Insights; execution elsewhere",
    ours: "Scan → tasks → assign → close",
  },
  {
    label: "Billing fit",
    free: "Free / freemium",
    trackers: "Credit or seat tiers",
    ours: "PK & international agency plans",
  },
];

const faq = [
  {
    q: "What is the best AEO tool for agencies?",
    a: "The best AEO tool for agencies is one that supports multiple clients, turns findings into assignable work, and produces client-ready reports. AEO Command is built for that workflow; free checkers are built for a single curiosity scan; pure trackers excel at monitoring but often leave delivery outside the product.",
  },
  {
    q: "Are free AEO checkers useless?",
    a: "No. They are useful for awareness and education. They fall short when you need ongoing delivery, team coordination, and branded reporting across a client roster.",
  },
  {
    q: "How does AEO Command differ from Peec AI, Profound, or LLM Pulse?",
    a: "Those platforms are strong at multi-engine visibility analytics. AEO Command focuses on multi-tenant agency operations: scan, Action Center, assignment, and white-label live reports under strict agencyId isolation. Many agencies will use a tracker plus a delivery system; AEO Command is the delivery system.",
  },
  {
    q: "What keywords should agencies target when selling AEO?",
    a: "Common commercial phrases include AEO tool for agencies, white-label AEO report, multi-client AEO software, AI visibility tracking for agencies, and ChatGPT citation optimization. Educational demand centers on what is AEO, AEO vs SEO, and GEO.",
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

export default function CompareAeoToolsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-4xl px-4 py-16">
        <p className="text-sm font-medium text-primary">Compare</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">
          AEO Command vs free checkers and agency trackers
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Free Answer Engine Optimization checkers answer: “How does this URL look
          right now?” Visibility trackers answer: “Where do we appear in AI
          answers?” Agencies get paid to answer: “What do we fix this week, who
          owns it, and what do we show the client?” AEO Command is built for that
          third question.
        </p>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3 font-medium">Capability</th>
                <th className="py-2 pr-3 font-medium">Free checkers</th>
                <th className="py-2 pr-3 font-medium">Visibility trackers</th>
                <th className="py-2 font-medium">AEO Command</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b align-top">
                  <td className="py-3 pr-3 font-medium">{r.label}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{r.free}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{r.trackers}</td>
                  <td className="py-3">{r.ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold mt-12">When a free checker is enough</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Use a free tool to learn vocabulary, demo a concept in a meeting, or
          scan a personal project. Do not build a retainer on screenshots.
        </p>

        <h2 className="text-xl font-semibold mt-8">When a visibility tracker shines</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Platforms such as Peec AI, Profound, LLM Pulse, Otterly, Rankability,
          and suite add-ons from Semrush or Ahrefs excel at multi-engine mention
          and citation analytics. Use them when the engagement is research-heavy.
          Pair them with a delivery workflow when the client expects weekly fixes
          and branded reporting.
        </p>

        <h2 className="text-xl font-semibold mt-8">When you need AEO Command</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          You manage multiple client domains, need an Action Center instead of a
          PDF dump, want teammates to own tasks under strict tenancy, and must
          send a white-label report that matches your agency brand. See the{" "}
          <Link href="/product" className="underline">
            product walkthrough
          </Link>
          ,{" "}
          <Link href="/guides/aeo-checklist" className="underline">
            AEO checklist
          </Link>
          , and{" "}
          <Link href="/aeo" className="underline">
            what is AEO
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
          <p className="font-medium">Run your roster on a real AEO workflow</p>
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
