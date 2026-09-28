import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Client AEO portal",
  robots: { index: false, follow: false },
};

const PRINT_CSS = `
  @media print {
    .no-print { display: none !important; }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: white !important;
    }
    .report-shell { background: white !important; min-height: auto !important; }
    .report-article { max-width: 100% !important; padding: 0 !important; }
    .report-section { break-inside: avoid; page-break-inside: avoid; }
    a { color: inherit; text-decoration: none; }
    @page { margin: 1.5cm; }
  }
`;

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const client = await prisma.client.findFirst({
    where: {
      portalToken: token,
      portalEnabled: true,
      deletedAt: null,
    },
    include: {
      agency: {
        select: {
          name: true,
          logoUrl: true,
          brandColors: true,
        },
      },
      actions: {
        where: { deletedAt: null },
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        take: 40,
        select: {
          id: true,
          title: true,
          priority: true,
          category: true,
          status: true,
          whyItMatters: true,
          effortLevel: true,
          updatedAt: true,
        },
      },
      trackedPrompts: {
        where: { deletedAt: null },
        take: 20,
        include: {
          snapshots: {
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
        },
      },
      scans: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { completedAt: true, aiAnalysis: true },
      },
    },
  });

  if (!client) notFound();

  const primary =
    (client.agency.brandColors as { primary?: string } | null)?.primary ||
    "#111827";

  const total = client.actions.length;
  const done = client.actions.filter((a) => a.status === "DONE").length;
  const inProgress = client.actions.filter(
    (a) => a.status === "IN_PROGRESS"
  ).length;
  const todo = client.actions.filter((a) => a.status === "TODO").length;
  const analysis =
    (client.scans[0]?.aiAnalysis as {
      summary?: string;
      scores?: Record<string, number>;
    } | null) || null;

  return (
    <div className="report-shell min-h-screen bg-slate-50 text-gray-900">
      <style>{PRINT_CSS}</style>

      <div className="no-print sticky top-0 z-10 border-b bg-white/95 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-500">Live client portal · read-only</span>
        <div className="flex gap-2">
          <a
            href={`/api/portal/${token}/pdf`}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 no-underline"
          >
            Download PDF
          </a>
          <a
            href="javascript:window.print()"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 no-underline text-inherit"
          >
            Print
          </a>
        </div>
      </div>

      <article className="report-article mx-auto max-w-3xl px-6 py-10 space-y-10">
        <header className="report-section border-b pb-8">
          <div className="flex items-center gap-4 mb-6">
            {client.agency.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.agency.logoUrl}
                alt={client.agency.name}
                className="h-10 object-contain"
              />
            ) : (
              <span className="text-lg font-bold" style={{ color: primary }}>
                {client.agency.name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AEO progress</h1>
          <p className="mt-2 text-lg text-gray-600">{client.name}</p>
          <p className="text-sm text-gray-500">{client.websiteUrl}</p>
          <p className="text-xs text-gray-400 mt-2">
            Updated live · last scan{" "}
            {client.lastScannedAt
              ? new Date(client.lastScannedAt).toLocaleString()
              : "not yet"}
          </p>
        </header>

        <section className="report-section">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Visibility score
          </h2>
          <p className="text-5xl font-bold" style={{ color: primary }}>
            {client.currentVisibilityScore != null
              ? client.currentVisibilityScore
              : "—"}
            <span className="text-2xl text-gray-400">/100</span>
          </p>
        </section>

        <section className="report-section">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Action progress
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500">To do</p>
              <p className="text-2xl font-semibold">{todo}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500">In progress</p>
              <p className="text-2xl font-semibold">{inProgress}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500">Done</p>
              <p className="text-2xl font-semibold">{done}</p>
            </div>
          </div>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-3">
              {done} of {total} recommended actions completed
            </p>
          )}
        </section>

        {analysis?.summary && (
          <section className="report-section">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Latest analysis
            </h2>
            <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
          </section>
        )}

        {analysis?.scores && (
          <section className="report-section">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Dimension scores
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(analysis.scores).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border bg-white p-3 text-center"
                >
                  <p className="text-xs text-gray-500 capitalize">{k}</p>
                  <p className="text-xl font-semibold mt-1">{v}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {client.actions.length > 0 && (
          <section className="report-section">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Recommended actions
            </h2>
            <div className="space-y-4">
              {client.actions.map((a) => (
                <div
                  key={a.id}
                  className="border-l-2 pl-4 bg-white/50 py-2 report-section"
                  style={{ borderColor: primary }}
                >
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1">
                    <span className="font-medium">{a.priority}</span>
                    <span>·</span>
                    <span>{a.category}</span>
                    <span>·</span>
                    <span className="uppercase tracking-wide">{a.status}</span>
                  </div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{a.whyItMatters}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {client.trackedPrompts.length > 0 && (
          <section className="report-section">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Tracked prompts
            </h2>
            <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 px-3">Prompt</th>
                  <th className="py-2 px-3">Latest score</th>
                </tr>
              </thead>
              <tbody>
                {client.trackedPrompts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2 px-3">{p.promptText}</td>
                    <td className="py-2 px-3 font-medium">
                      {p.snapshots[0]
                        ? Number(p.snapshots[0].score)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="border-t pt-6 text-xs text-gray-400 report-section">
          Prepared for you by {client.agency.name} · Live portal · Powered by AEO
          Command
        </footer>
      </article>
    </div>
  );
}
