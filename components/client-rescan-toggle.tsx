"use client";

import { useState } from "react";

export function ClientRescanToggle({
  clientId,
  initialEnabled,
  initialIntervalDays,
  initialNextRescanAt,
}: {
  clientId: string;
  initialEnabled: boolean;
  initialIntervalDays: number;
  initialNextRescanAt: string | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [intervalDays, setIntervalDays] = useState(initialIntervalDays || 7);
  const [nextAt, setNextAt] = useState(initialNextRescanAt);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(nextEnabled: boolean, days: number) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rescanEnabled: nextEnabled,
          rescanIntervalDays: days,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setEnabled(data.client.rescanEnabled);
      setIntervalDays(data.client.rescanIntervalDays);
      setNextAt(data.client.nextRescanAt);
      setMsg(nextEnabled ? "Weekly re-scan on" : "Re-scan off");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-sm">Automatic re-scan</p>
          <p className="text-xs text-muted-foreground">
            Inngest cron picks up due clients (requires Inngest in production).
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => save(!enabled, intervalDays)}
          className={`rounded-full px-3 py-1 text-xs font-medium border ${
            enabled
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white"
          }`}
        >
          {enabled ? "On" : "Off"}
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label className="text-muted-foreground">Every</label>
        <select
          value={intervalDays}
          disabled={busy}
          onChange={(e) => {
            const d = Number(e.target.value);
            setIntervalDays(d);
            if (enabled) void save(true, d);
          }}
          className="rounded-md border px-2 py-1"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>
      {enabled && nextAt && (
        <p className="text-xs text-muted-foreground">
          Next run: {new Date(nextAt).toLocaleString()}
        </p>
      )}
      {msg && <p className="text-xs text-green-700">{msg}</p>}
    </div>
  );
}
