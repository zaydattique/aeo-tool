"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type ScanInfo = {
  id: string;
  status: string;
  stage: string;
  progress: number;
};

type ClientItem = {
  id: string;
  name: string;
  websiteUrl: string;
  brandName: string | null;
  location: string | null;
  currentVisibilityScore: number | null;
  lastScannedAt: string | null;
  status: string;
  createdAt: string;
  scans: ScanInfo[];
};

export function ClientList({ initialClients }: { initialClients: ClientItem[] }) {
  const [clients, setClients] = useState(initialClients);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set());

  // Poll active scans
  const activeScanIds = clients
    .filter(
      (c) =>
        c.scans[0] &&
        (c.scans[0].status === "QUEUED" || c.scans[0].status === "RUNNING")
    )
    .map((c) => c.scans[0].id);

  const pollScans = useCallback(async () => {
    if (activeScanIds.length === 0) return;

    for (const scanId of activeScanIds) {
      try {
        const res = await fetch(`/api/scans/${scanId}`);
        if (!res.ok) continue;
        const data = await res.json();
        const scan = data.scan;

        setClients((prev) =>
          prev.map((c) => {
            if (c.id !== scan.clientId) return c;
            return {
              ...c,
              status:
                scan.status === "COMPLETED"
                  ? "ACTIVE"
                  : scan.status === "FAILED"
                    ? "ERROR"
                    : "SCANNING",
              currentVisibilityScore:
                scan.client?.currentVisibilityScore ?? c.currentVisibilityScore,
              lastScannedAt:
                scan.status === "COMPLETED"
                  ? new Date().toISOString()
                  : c.lastScannedAt,
              scans: [
                {
                  id: scan.id,
                  status: scan.status,
                  stage: scan.stage,
                  progress: scan.progress,
                },
              ],
            };
          })
        );

        if (scan.status === "COMPLETED" || scan.status === "FAILED") {
          setScanningIds((prev) => {
            const next = new Set(prev);
            next.delete(scan.clientId);
            return next;
          });
        }
      } catch {
        // ignore poll errors
      }
    }
  }, [activeScanIds.join(",")]);

  useEffect(() => {
    if (activeScanIds.length === 0) return;
    const interval = setInterval(pollScans, 1500);
    return () => clearInterval(interval);
  }, [pollScans, activeScanIds.length]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: url,
          name: name || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add client");
        setLoading(false);
        return;
      }

      const c = data.client;
      setClients((prev) => [
        {
          id: c.id,
          name: c.name,
          websiteUrl: c.websiteUrl,
          brandName: c.brandName,
          location: c.location,
          currentVisibilityScore: c.currentVisibilityScore,
          lastScannedAt: c.lastScannedAt,
          status: c.status,
          createdAt: c.createdAt,
          scans: [],
        },
        ...prev,
      ]);
      setUrl("");
      setName("");
      setShowAdd(false);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartScan(clientId: string) {
    setError("");
    setScanningIds((prev) => new Set(prev).add(clientId));

    try {
      const res = await fetch(`/api/clients/${clientId}/scan`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start scan");
        setScanningIds((prev) => {
          const next = new Set(prev);
          next.delete(clientId);
          return next;
        });
        return;
      }

      const scan = data.scan;
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                status: "SCANNING",
                scans: [
                  {
                    id: scan.id,
                    status: scan.status,
                    stage: scan.stage,
                    progress: scan.progress,
                  },
                ],
              }
            : c
        )
      );
    } catch {
      setError("Failed to start scan");
      setScanningIds((prev) => {
        const next = new Set(prev);
        next.delete(clientId);
        return next;
      });
    }
  }

  function stageLabel(stage: string) {
    const map: Record<string, string> = {
      QUEUED: "Queued",
      CRAWL: "Crawling site…",
      EXTRACT: "Extracting signals…",
      AI_ANALYSIS: "AI analysis…",
      ACTION_GENERATION: "Generating actions…",
      COMPLETED: "Complete",
      FAILED: "Failed",
    };
    return map[stage] || stage;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Clients</h2>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Add client
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 underline"
          >
            dismiss
          </button>
        </div>
      )}

      {showAdd && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-medium mb-4">Add new client</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Website URL</label>
              <input
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Name (optional)
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Auto-detected from URL if empty"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Adding…" : "Add client"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                }}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">
            No clients yet. Add your first client to run an AEO scan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const latestScan = client.scans[0];
            const isScanning =
              client.status === "SCANNING" ||
              scanningIds.has(client.id) ||
              (latestScan &&
                (latestScan.status === "QUEUED" ||
                  latestScan.status === "RUNNING"));

            return (
              <div
                key={client.id}
                className="rounded-lg border bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="font-medium hover:underline truncate"
                    >
                      {client.name}
                    </Link>
                    <StatusBadge status={client.status} />
                  </div>
                  <a
                    href={client.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:underline truncate block"
                  >
                    {client.websiteUrl}
                  </a>

                  {isScanning && latestScan && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{stageLabel(latestScan.stage)}</span>
                        <span>{latestScan.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${latestScan.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!isScanning && client.currentVisibilityScore != null && (
                    <p className="mt-1 text-sm">
                      Visibility score:{" "}
                      <span className="font-medium">
                        {client.currentVisibilityScore}/100
                      </span>
                      {client.lastScannedAt && (
                        <span className="text-muted-foreground">
                          {" · "}
                          {new Date(client.lastScannedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartScan(client.id)}
                    disabled={!!isScanning}
                    className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScanning ? "Scanning…" : "Start scan"}
                  </button>
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    SCANNING: "bg-blue-50 text-blue-700",
    ERROR: "bg-red-50 text-red-700",
    ARCHIVED: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
}
