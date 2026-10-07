import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { hashCapabilityToken } from "@/lib/capability-tokens";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AEO Report", robots: { index: false, follow: false } };

type ReportConfig = {
  agencyName?: string;
  agencyLogoUrl?: string | null;
  brandColors?: { primary?: string } | null;
  clientName?: string;
  websiteUrl?: string;
  visibilityScore?: number | null;
  generatedAt?: string;
  analysis?: { summary?: string; scores?: Record<string, number>; strengths?: string[]; weaknesses?: string[] } | null;
  actions?: { priority: string; category: string; title: string; whyItMatters: string; status: string; effortLevel: string; suggestedText?: string | null }[];
  prompts?: { promptText: string; latestScore: number | null }[];
};

export default async function LiveReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = hashCapabilityToken(token);
  const rl = await rateLimit(`public-report:${tokenHash}`, 60, 60_000);
  if (!rl.ok) notFound();

  const report = await prisma.report.findFirst({ where: { liveLinkTokenHash: tokenHash, deletedAt: null } });
  if (!report) notFound();

  const config = (report.config as ReportConfig) || {};
  const primary = config.brandColors?.primary || "#111827";

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="sticky top-0 z-10 border-b bg-white/95 px-4 py-3 flex items-center justify-between gap-2">
        <span className="text-sm text-gray-500">White-label AEO report</span>
        <a href={`/api/reports/${token}/pdf`} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">Download PDF</a>
      </div>
      <article className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <header className="border-b pb-8">
          {config.agencyLogoUrl ? <img src={config.agencyLogoUrl} alt={config.agencyName || "Agency"} className="h-10 object-contain mb-6" /> : <div className="text-lg font-bold mb-6" style={{ color: primary }}>{config.agencyName || "Agency"}</div>}
          <h1 className="text-3xl font-bold">AEO Visibility Report</h1>
          <p className="mt-2 text-lg text-gray-600">{config.clientName}</p>
          {config.websiteUrl && <p className="text-sm text-gray-500">{config.websiteUrl}</p>}
        </header>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Visibility score</h2>
          <p className="text-5xl font-bold mt-3" style={{ color: primary }}>{config.visibilityScore ?? "—"}<span className="text-2xl text-gray-400">/100</span></p>
        </section>
        {config.analysis?.summary && <section><h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Summary</h2><p className="text-gray-700 leading-relaxed">{config.analysis.summary}</p></section>}
        {config.analysis?.scores && <section><h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Dimension scores</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Object.entries(config.analysis.scores).map(([k,v]) => <div key={k} className="rounded-lg border p-4 text-center"><p className="text-xs text-gray-500 capitalize">{k}</p><p className="text-2xl font-semibold mt-1">{v}</p></div>)}</div></section>}
        {config.analysis?.strengths?.length ? <section><h2 className="text-sm font-semibold uppercase tracking-wide text-green-700 mb-3">Strengths</h2><ul className="space-y-1 text-sm">{config.analysis.strengths.map((s,i)=><li key={i}>• {s}</li>)}</ul></section> : null}
        {config.analysis?.weaknesses?.length ? <section><h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 mb-3">Weaknesses</h2><ul className="space-y-1 text-sm">{config.analysis.weaknesses.map((s,i)=><li key={i}>• {s}</li>)}</ul></section> : null}
        {config.actions?.length ? <section><h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Recommended actions ({config.actions.length})</h2><div className="space-y-4">{config.actions.map((a,i)=><div key={i} className="border-l-2 pl-4" style={{borderColor:primary}}><div className="text-xs text-gray-500">{a.priority} · {a.category} · {a.status}</div><p className="font-medium mt-1">{a.title}</p><p className="text-sm text-gray-600 mt-1">{a.whyItMatters}</p>{a.suggestedText && <p className="text-sm mt-1"><span className="font-medium">Fix: </span>{a.suggestedText}</p>}</div>)}</div></section> : null}
        {config.prompts?.length ? <section><h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Tracked prompts</h2><table className="w-full text-sm"><tbody>{config.prompts.map((p,i)=><tr key={i} className="border-b"><td className="py-2 pr-4">{p.promptText}</td><td className="py-2 font-medium">{p.latestScore ?? "—"}</td></tr>)}</tbody></table></section> : null}
        <footer className="border-t pt-6 text-xs text-gray-400">Prepared by {config.agencyName || "Agency"} · Powered by AEO Command</footer>
      </article>
    </main>
  );
}
