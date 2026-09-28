"use client";

import { useState, useEffect, useCallback } from "react";

type Snapshot = {
  id: string;
  score: number;
  recordedAt: string;
};

type Prompt = {
  id: string;
  promptText: string;
  isCustom: boolean;
  kind?: string;
  targetName?: string | null;
  latestScore?: number | null;
  snapshots: Snapshot[];
};

type Report = {
  id: string;
  liveLinkToken: string | null;
  createdAt: string;
};

type Sov = {
  clientSharePct: number | null;
  competitorSharePct: number | null;
  clientAvgScore: number | null;
  competitorAvgScore: number | null;
  brandPromptCount: number;
  competitorPromptCount: number;
  categoryPromptCount: number;
  byCompetitor: { name: string; avgScore: number; promptCount: number }[];
  note: string;
};

type EngineCap = {
  engine: string;
  configured: boolean;
  envVar: string;
};

export function VisibilityReports({ clientId }: { clientId: string }) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [sov, setSov] = useState<Sov | null>(null);
  const [engineCaps, setEngineCaps] = useState<EngineCap[]>([]);
  const [engineNote, setEngineNote] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastLiveUrl, setLastLiveUrl] = useState("");
  const [lastCheckInfo, setLastCheckInfo] = useState("");

  const load = useCallback(async () => {
    try {
      const [pRes, rRes, eRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/prompts`),
        fetch(`/api/clients/${clientId}/reports`),
        fetch("/api/visibility/status"),
      ]);
      if (pRes.ok) {
        const data = await pRes.json();
        setPrompts(data.prompts || []);
        setCompetitors(data.competitors || []);
        setSov(data.sov || null);
      }
      if (rRes.ok) {
        const data = await rRes.json();
        setReports(data.reports || []);
      }
      if (eRes.ok) {
        const data = await eRes.json();
        setEngineCaps(data.engines || []);
        setEngineNote(data.note || "");
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function seedDefaults() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: "seed", seedDefaults: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed");
      } else {
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveCompetitors(next: string[], seedPrompts: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/competitors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: next, seedPrompts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save competitors");
        return;
      }
      setCompetitors(data.competitors || []);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function addCompetitor(e: React.FormEvent) {
    e.preventDefault();
    const name = competitorInput.trim();
    if (!name) return;
    if (competitors.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setCompetitorInput("");
      return;
    }
    const next = [...competitors, name].slice(0, 15);
    setCompetitorInput("");
    saveCompetitors(next, true);
  }

  function removeCompetitor(name: string) {
    saveCompetitors(
      competitors.filter((c) => c !== name),
      false
    );
  }

  async function addPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrompt.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: newPrompt.trim(), kind: "brand" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setNewPrompt("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function deletePrompt(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function recordSnapshots() {
    setBusy(true);
    setError("");
    setLastCheckInfo("");
    try {
      const res = await fetch(`/api/clients/${clientId}/snapshots`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record");
      } else {
        const live = data.maxLiveEngines ?? 0;
        setLastCheckInfo(
          live > 0
            ? `Check saved · up to ${live} live engine(s) responded`
            : "Check saved · heuristic only (no live API keys)"
        );
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function generateReport() {
    setBusy(true);
    setError("");
    setLastLiveUrl("");
    try {
      const res = await fetch(`/api/clients/${clientId}/reports`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate report");
      } else {
        setLastLiveUrl(data.liveUrl);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  const historyPoints = buildHistory(prompts);

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
        Loading visibility…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Live engines status */}
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Live engines
        </p>
        <div className="flex flex-wrap gap-2">
          {(engineCaps.length
            ? engineCaps
            : [
                { engine: "perplexity", configured: false, envVar: "" },
                { engine: "chatgpt", configured: false, envVar: "" },
                { engine: "gemini", configured: false, envVar: "" },
                { engine: "claude", configured: false, envVar: "" },
              ]
          ).map((e) => (
            <span
              key={e.engine}
              className={`rounded-full px-2.5 py-1 text-xs border ${
                e.configured
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              {e.engine}
              {e.configured ? " · live" : " · heuristic"}
            </span>
          ))}
          <span className="rounded-full px-2.5 py-1 text-xs border bg-slate-50 text-slate-500">
            ai_overviews · heuristic
          </span>
        </div>
        {engineNote && (
          <p className="text-xs text-muted-foreground mt-2">{engineNote}</p>
        )}
      </div>

      {/* Competitors + SOV */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div>
          <h2 className="font-medium text-lg">Competitors & share-of-answer</h2>
          <p className="text-sm text-muted-foreground">
            Add competitor brands. We seed vs-prompts and estimate relative
            presence after each visibility check.
          </p>
        </div>

        <form onSubmit={addCompetitor} className="flex gap-2">
          <input
            value={competitorInput}
            onChange={(e) => setCompetitorInput(e.target.value)}
            placeholder="Competitor brand name…"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={busy || !competitorInput.trim()}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Add + seed prompts
          </button>
        </form>

        {competitors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {competitors.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full border bg-slate-50 px-3 py-1 text-xs"
              >
                {c}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeCompetitor(c)}
                  className="text-red-600 hover:underline"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {sov && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border p-3 text-center">
              <p className="text-xs text-muted-foreground">Client share</p>
              <p className="text-2xl font-semibold mt-1">
                {sov.clientSharePct != null ? `${sov.clientSharePct}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                avg score {sov.clientAvgScore ?? "—"}
              </p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-xs text-muted-foreground">Competitor share</p>
              <p className="text-2xl font-semibold mt-1">
                {sov.competitorSharePct != null
                  ? `${sov.competitorSharePct}%`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                avg score {sov.competitorAvgScore ?? "—"}
              </p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-xs text-muted-foreground">Prompt mix</p>
              <p className="text-sm mt-2">
                {sov.brandPromptCount} brand · {sov.categoryPromptCount}{" "}
                category · {sov.competitorPromptCount} competitor
              </p>
            </div>
          </div>
        )}

        {sov && sov.byCompetitor.length > 0 && (
          <div className="text-sm space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              By competitor
            </p>
            {sov.byCompetitor.map((c) => (
              <div
                key={c.name}
                className="flex justify-between border-b border-gray-100 py-1"
              >
                <span>{c.name}</span>
                <span className="text-muted-foreground">
                  avg {c.avgScore} · {c.promptCount} prompts
                </span>
              </div>
            ))}
          </div>
        )}

        {sov?.note && (
          <p className="text-xs text-muted-foreground">{sov.note}</p>
        )}
      </div>

      {/* Visibility tracking */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-lg">Visibility tracking</h2>
            <p className="text-sm text-muted-foreground">
              Track how prompts score over time across live + heuristic engines
            </p>
          </div>
          <div className="flex gap-2">
            {prompts.length === 0 && (
              <button
                onClick={seedDefaults}
                disabled={busy}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Seed default prompts
              </button>
            )}
            <button
              onClick={recordSnapshots}
              disabled={busy}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Record check
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {lastCheckInfo && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            {lastCheckInfo}
          </div>
        )}

        {historyPoints.length > 0 && (
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Average score over time
            </p>
            <ScoreChart points={historyPoints} />
          </div>
        )}

        <div className="space-y-2">
          {prompts.map((p) => {
            const latest = p.snapshots[0];
            const kind = p.kind || "brand";
            return (
              <div
                key={p.id}
                className="rounded-lg border bg-white p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2 items-center mb-1">
                    <span className="text-[10px] uppercase tracking-wide rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                      {kind}
                    </span>
                    {p.targetName && (
                      <span className="text-[10px] text-muted-foreground">
                        vs {p.targetName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{p.promptText}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latest
                      ? `Latest: ${latest.score}/100 · ${new Date(latest.recordedAt).toLocaleDateString()}`
                      : "No snapshots yet"}
                    {p.isCustom ? " · custom" : " · default"}
                  </p>
                  {p.snapshots.length > 1 && (
                    <MiniSpark
                      scores={p.snapshots.map((s) => s.score).reverse()}
                    />
                  )}
                </div>
                <button
                  onClick={() => deletePrompt(p.id)}
                  disabled={busy}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <form onSubmit={addPrompt} className="flex gap-2">
          <input
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Add custom prompt…"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={busy || !newPrompt.trim()}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>

      {/* Reports */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-lg">White-label reports</h2>
            <p className="text-sm text-muted-foreground">
              Generate a shareable live report link
            </p>
          </div>
          <button
            onClick={generateReport}
            disabled={busy}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Generate report
          </button>
        </div>

        {lastLiveUrl && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            Report ready:{" "}
            <a
              href={lastLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Open live link
            </a>
            {" · "}
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}${lastLiveUrl}`
                )
              }
              className="underline"
            >
              Copy URL
            </button>
          </div>
        )}

        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reports yet. Generate one after a scan.
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border bg-white p-3 flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
                {r.liveLinkToken && (
                  <a
                    href={`/r/${r.liveLinkToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Open live report
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildHistory(
  prompts: Prompt[]
): { date: string; avg: number }[] {
  const byDate: Record<string, number[]> = {};
  for (const p of prompts) {
    for (const s of p.snapshots) {
      const d = new Date(s.recordedAt).toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(s.score);
    }
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
}

function ScoreChart({ points }: { points: { date: string; avg: number }[] }) {
  if (points.length === 0) return null;
  const max = 100;
  const w = 100;
  const h = 40;
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * w;
    const y = h - (p.avg / max) * h;
    return `${x},${y}`;
  });

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-24"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          points={coords.join(" ")}
        />
        {points.map((p, i) => {
          const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * w;
          const y = h - (p.avg / max) * h;
          return <circle key={i} cx={x} cy={y} r="1.5" fill="#3b82f6" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.avg}/100 avg</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function MiniSpark({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const max = 100;
  const w = 60;
  const h = 16;
  const coords = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - (s / max) * h;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-4 mt-1">
      <polyline
        fill="none"
        stroke="#6b7280"
        strokeWidth="1"
        points={coords.join(" ")}
      />
    </svg>
  );
}
