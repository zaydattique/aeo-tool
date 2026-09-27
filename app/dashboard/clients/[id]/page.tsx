import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClientActions } from "./client-actions";

type AnalysisIssue = {
  category: string;
  priority: string;
  title: string;
  whyItMatters: string;
  effort: string;
  suggestedFix: string;
};

type AiAnalysis = {
  visibilityScore?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  scores?: {
    technical: number;
    content: number;
    schema: number;
    entity: number;
  };
  issues?: AnalysisIssue[];
  provider?: string;
  model?: string | null;
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) redirect("/login");

  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: {
      id,
      agencyId: session.user.agencyId,
      deletedAt: null,
    },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!client) notFound();

  const latestCompleted = client.scans.find((s) => s.status === "COMPLETED");
  const analysis = (latestCompleted?.aiAnalysis as AiAnalysis | null) || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to clients
            </Link>
            <h1 className="text-lg font-semibold mt-1">{client.name}</h1>
            <a
              href={client.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:underline"
            >
              {client.websiteUrl}
            </a>
          </div>
          <ClientActions
            clientId={client.id}
            initialStatus={client.status}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Visibility score"
            value={
              client.currentVisibilityScore != null
                ? `${client.currentVisibilityScore}/100`
                : "—"
            }
          />
          <StatCard label="Status" value={client.status.toLowerCase()} />
          <StatCard
            label="Last scanned"
            value={
              client.lastScannedAt
                ? new Date(client.lastScannedAt).toLocaleString()
                : "Never"
            }
          />
        </div>

        {analysis && (
          <>
            {analysis.summary && (
              <div className="rounded-lg border bg-white p-5">
                <h2 className="font-medium mb-2">Analysis summary</h2>
                <p className="text-sm text-muted-foreground">
                  {analysis.summary}
                </p>
                {analysis.provider && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Provider: {analysis.provider}
                    {analysis.model ? ` · ${analysis.model}` : ""}
                  </p>
                )}
              </div>
            )}

            {analysis.scores && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["technical", "content", "schema", "entity"] as const).map(
                  (key) => (
                    <div
                      key={key}
                      className="rounded-lg border bg-white p-3 text-center"
                    >
                      <p className="text-xs text-muted-foreground capitalize">
                        {key}
                      </p>
                      <p className="text-xl font-semibold mt-1">
                        {analysis.scores![key]}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="rounded-lg border bg-white p-4">
                  <h3 className="text-sm font-medium text-green-700 mb-2">
                    Strengths
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {analysis.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                <div className="rounded-lg border bg-white p-4">
                  <h3 className="text-sm font-medium text-amber-700 mb-2">
                    Weaknesses
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {analysis.weaknesses.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {analysis.issues && analysis.issues.length > 0 && (
              <div>
                <h2 className="font-medium mb-3">
                  Issues ({analysis.issues.length})
                </h2>
                <div className="space-y-3">
                  {analysis.issues.map((issue, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-white p-4 space-y-1"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={issue.priority} />
                        <span className="text-xs rounded bg-gray-100 px-1.5 py-0.5">
                          {issue.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          effort: {issue.effort?.toLowerCase()}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {issue.whyItMatters}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Fix: </span>
                        {issue.suggestedFix}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Full Action Center (assign, track, mark done) arrives in Phase
                  6.
                </p>
              </div>
            )}
          </>
        )}

        <div>
          <h2 className="font-medium mb-3">Scan history</h2>
          {client.scans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scans yet. Click "Start scan" to begin.
            </p>
          ) : (
            <div className="space-y-2">
              {client.scans.map((scan) => (
                <div
                  key={scan.id}
                  className="rounded-lg border bg-white p-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{scan.status}</span>
                    <span className="text-muted-foreground">
                      {" · "}{scan.stage} · {scan.progress}%
                    </span>
                    {scan.errorMessage && (
                      <p className="text-red-600 text-xs mt-1">
                        {scan.errorMessage}
                      </p>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(scan.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1 capitalize">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    HIGH: "bg-red-50 text-red-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    LOW: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
        colors[priority] || colors.LOW
      }`}
    >
      {priority}
    </span>
  );
}
