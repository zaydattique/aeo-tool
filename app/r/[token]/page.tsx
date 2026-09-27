import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type ReportConfig = {
  agencyName?: string;
  agencyLogoUrl?: string | null;
  brandColors?: { primary?: string } | null;
  clientName?: string;
  websiteUrl?: string;
  visibilityScore?: number | null;
  generatedAt?: string;
  analysis?: {
    summary?: string;
    scores?: {
      technical: number;
      content: number;
      schema: number;
      entity: number;
    };
    strengths?: string[];
    weaknesses?: string[];
  } | null;
  actions?: {
    priority: string;
    category: string;
    title: string;
    whyItMatters: string;
    status: string;
    effortLevel: string;
    suggestedText?: string | null;
  }[];
  prompts?: {
    promptText: string;
    latestScore: number | null;
  }[];
};

export default async function LiveReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const report = await prisma.report.findFirst({
    where: { liveLinkToken: token, deletedAt: null },
  });

  if (!report) notFound();

  const config = (report.config as ReportConfig) || {};
  const primary =
    (config.brandColors as { primary?: string } | null)?.primary || "#111827";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print sticky top-0 border-b bg-white/95 backdrop-blur px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">Live AEO Report</span>
        <button
          onClick={undefined}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          // client-side print via script below
        >
          <a href="javascript:window.print()" className="no-underline text-inherit">
            Print / Save PDF
          </a>
        </button>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        {/* Header */}
        <header className="border-b pb-8">
          <div className="flex items-center gap-4 mb-6">
            {config.agencyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.agencyLogoUrl}
                alt={config.agencyName || "Agency"}
                className="h-10 object-contain"
              />
            ) : (
              <span
                className="text-lg font-bold"
                style={{ color: primary }}
              >
                {config.agencyName || "Agency"}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            AEO Visibility Report
          </h1>
          <p className="mt-2 text-lg text-gray-600">{config.clientName}</p>
          {config.websiteUrl && (
            <p className="text-sm text-gray-500">{config.websiteUrl}</p>
          )}
          {config.generatedAt && (
            <p className="text-xs text-gray-400 mt-2">
              Generated {new Date(config.generatedAt).toLocaleString()}
            </p>
          )}
        </header>

        {/* Score */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Visibility score
          </h2>
          <p className="text-5xl font-bold" style={{ color: primary }}>
            {config.visibilityScore != null
              ? `${config.visibilityScore}`
              : "—"}
            <span className="text-2xl text-gray-400">/100</span>
          </p>
        </section>

        {/* Summary */}
        {config.analysis?.summary && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {config.analysis.summary}
            </p>
          </section>
        )}

        {/* Dimension scores */}
        {config.analysis?.scores && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Dimension scores
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(config.analysis.scores).map(([k, v]) => (
                <div key={k} className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-gray-500 capitalize">{k}</p>
                  <p className="text-2xl font-semibold mt-1">{v}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strengths / Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {config.analysis?.strengths &&
            config.analysis.strengths.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700 mb-3">
                  Strengths
                </h2>
                <ul className="space-y-1 text-sm text-gray-700">
                  {config.analysis.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </section>
            )}
          {config.analysis?.weaknesses &&
            config.analysis.weaknesses.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 mb-3">
                  Weaknesses
                </h2>
                <ul className="space-y-1 text-sm text-gray-700">
                  {config.analysis.weaknesses.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </section>
            )}
        </div>

        {/* Actions */}
        {config.actions && config.actions.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Recommended actions ({config.actions.length})
            </h2>
            <div className="space-y-4">
              {config.actions.map((a, i) => (
                <div key={i} className="border-l-2 pl-4" style={{ borderColor: primary }}>
                  <div className="flex gap-2 text-xs text-gray-500 mb-1">
                    <span className="font-medium">{a.priority}</span>
                    <span>·</span>
                    <span>{a.category}</span>
                    <span>·</span>
                    <span>{a.status}</span>
                  </div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{a.whyItMatters}</p>
                  {a.suggestedText && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Fix: </span>
                      {a.suggestedText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Prompt visibility */}
        {config.prompts && config.prompts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Tracked prompts
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Prompt</th>
                  <th className="py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {config.prompts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{p.promptText}</td>
                    <td className="py-2 font-medium">
                      {p.latestScore != null ? p.latestScore : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="border-t pt-6 text-xs text-gray-400">
          Prepared by {config.agencyName || "Agency"} · Powered by AEO Command
        </footer>
      </article>
    </div>
  );
}
