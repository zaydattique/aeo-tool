"use client";

import { useCallback, useEffect, useState } from "react";

export function ClientPortalToggle({ clientId }: { clientId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [path, setPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/portal`);
    if (res.ok) {
      const data = await res.json();
      setEnabled(!!data.portalEnabled);
      setPath(data.portalPath || null);
    }
  }, [clientId]);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, [load]);

  async function run(action: "enable" | "disable" | "rotate") {
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch(`/api/clients/${clientId}/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setEnabled(!!data.portalEnabled);
      setPath(data.portalPath || null);
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    if (!path) return;
    const url = `${origin || window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <div className="rounded-lg border bg-white p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Client live portal</h2>
          <p className="text-sm text-muted-foreground">
            Share a read-only link that always shows live score, action progress,
            and prompts — separate from a frozen report snapshot.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!enabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("enable")}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Enable portal
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => run("rotate")}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Rotate link
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run("disable")}
                className="rounded-md border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Disable
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {enabled && path && (
        <div className="rounded-md bg-slate-50 p-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
          >
            {origin ? `${origin}${path}` : path}
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
