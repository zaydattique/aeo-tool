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
  snapshots: Snapshot[];
};

type Report = {
  id: string;
  liveLinkToken: string | null;
  createdAt: string;
};

export function VisibilityReports({ clientId }: { clientId: string }) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastLiveUrl, setLastLiveUrl] = useState("");

  const load = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/prompts`),
        fetch(`/api/clients/${clientId}/reports`),
      ]);
      if (pRes.ok) {
        const data = await pRes.json();
        setPrompts(data.prompts || []);
      }
      if (rRes.ok) {
        const data = await rRes.json();
        setReports(data.reports || []);
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

  async function addPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrompt.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: newPrompt.trim() }),
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
    try {
      const res = await fetch(`/api/clients/${clientId}/snapshots`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record");
      } else {
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

  // Build simple score history for chart (average per date)
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
      {/* Visibility tracking */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-lg">Visibility tracking</h2>
            <p className="text-sm text-muted-foreground">
              Track how prompts score over time
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

        {/* Simple score history chart */}
        {historyPoints.length > 0 && (
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Average score over time
            </p>
            <ScoreChart points={historyPoints} />
          </div>
        )}

        {/* Prompt list */}
        <div className="space-y-2">
          {prompts.map((p) => {
            const latest = p.snapshots[0];
            return (
              <div
                key={p.id}
                className="rounded-lg border bg-white p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{p.promptText}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latest
                      ? `Latest: ${latest.score}/100 · ${new Date(latest.recordedAt).toLocaleDateString()}`
                      : "No snapshots yet"}
                    {p.isCustom ? " · custom" : " · default"}
                  </p>
                  {p.snapshots.length > 1 && (
                    <MiniSpark scores={p.snapshots.map((s) => s.score).reverse()} />
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
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          points={coords.join(" ")}
        />
        {points.map((p, i) => {
          const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * w;
          const y = h - (p.avg / max) * h;
          return (
            <circle key={i} cx={x} cy={y} r="1.5" fill="#3b82f6" />
          );
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
