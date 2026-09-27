"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Agency = {
  id: string;
  name: string;
  slug: string;
  status: string;
  billingRegion: string;
  createdAt: string;
  plan: { name: string; slug: string } | null;
  _count: { users: number; clients: number; scans: number };
};

export default function AdminPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [metrics, setMetrics] = useState({
    totalAgencies: 0,
    active: 0,
    trial: 0,
    suspended: 0,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [region, setRegion] = useState("PAKISTAN");

  async function load() {
    const res = await fetch("/api/admin/agencies");
    if (res.ok) {
      const data = await res.json();
      setAgencies(data.agencies || []);
      setMetrics(data.metrics || metrics);
    } else if (res.status === 403) {
      setError("Super admin only");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createAgency(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ownerEmail,
          ownerName,
          ownerPassword,
          billingRegion: region,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setName("");
        setOwnerEmail("");
        setOwnerName("");
        setOwnerPassword("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/agencies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function impersonate(agencyId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      await update({
        agencyId: data.agencyId,
        agencyName: data.agencyName,
        onboardingCompleted: data.onboardingCompleted,
      });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold">Super Admin</h1>
            <p className="text-sm text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
          <Link href="/dashboard" className="text-sm underline">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Agencies" value={metrics.totalAgencies} />
          <Metric label="Active" value={metrics.active} />
          <Metric label="Trial" value={metrics.trial} />
          <Metric label="Suspended" value={metrics.suspended} />
        </div>

        <section className="space-y-3">
          <h2 className="font-medium">Create agency</h2>
          <form onSubmit={createAgency} className="grid gap-2 sm:grid-cols-2">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agency name"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Owner name"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              type="email"
              required
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="Owner email"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              minLength={8}
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder="Owner password"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="PAKISTAN">Pakistan</option>
              <option value="INTERNATIONAL">International</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Create
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Agencies</h2>
          <div className="space-y-2">
            {agencies.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.status} · {a.plan?.name || "no plan"} ·{" "}
                    {a._count.users} users · {a._count.clients} clients ·{" "}
                    {a._count.scans} scans
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => impersonate(a.id)}
                    disabled={busy}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Impersonate
                  </button>
                  {a.status !== "SUSPENDED" ? (
                    <button
                      onClick={() => setStatus(a.id, "SUSPENDED")}
                      disabled={busy}
                      className="rounded-md border px-2 py-1 text-xs text-red-600"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(a.id, "ACTIVE")}
                      disabled={busy}
                      className="rounded-md border px-2 py-1 text-xs text-green-700"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
