"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function ClientActions({
  clientId,
  initialStatus,
}: {
  clientId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [scanning, setScanning] = useState(initialStatus === "SCANNING");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [scanId, setScanId] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning || !scanId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/scans/${scanId}`);
        if (!res.ok) return;
        const data = await res.json();
        setProgress(data.scan.progress);
        setStage(data.scan.stage);

        if (
          data.scan.status === "COMPLETED" ||
          data.scan.status === "FAILED"
        ) {
          setScanning(false);
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // ignore
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [scanning, scanId, router]);

  async function startScan() {
    setError("");
    setScanning(true);
    setProgress(0);
    setStage("QUEUED");

    try {
      const res = await fetch(`/api/clients/${clientId}/scan`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start scan");
        setScanning(false);
        return;
      }

      setScanId(data.scan.id);
    } catch {
      setError("Failed to start scan");
      setScanning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={startScan}
        disabled={scanning}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {scanning ? "Scanning…" : "Start scan"}
      </button>

      {scanning && (
        <div className="w-48 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stage || "Starting…"}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
