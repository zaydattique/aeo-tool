"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Member = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
};

type Plan = {
  id: string;
  name: string;
  slug: string;
  region: string;
  priceMonthly: number;
  currency: string;
  maxClients: number;
  maxScansPerMonth: number;
};

export default function SettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("AGENCY_MEMBER");
  const [inviteUrl, setInviteUrl] = useState("");
  const [usage, setUsage] = useState<{
    plan: { name: string; slug: string } | null;
    usage: { clientsCount: number; scansUsed: number; teamSeats: number; promptsUsed: number };
    limits: Record<string, boolean> | null;
    plans: Plan[];
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [teamRes, usageRes] = await Promise.all([
      fetch("/api/team/invites"),
      fetch("/api/billing/usage"),
    ]);
    if (teamRes.ok) {
      const data = await teamRes.json();
      setMembers(data.members || []);
      setInvites(data.invites || []);
    }
    if (usageRes.ok) {
      const data = await usageRes.json();
      setUsage(data);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInviteUrl("");
    try {
      const res = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setInviteUrl(data.inviteUrl || data.devInviteUrl || "");
        setEmail("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function checkout(planSlug: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
      } else if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Portal failed");
      } else if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setBusy(false);
    }
  }

  function formatPrice(cents: number, currency: string) {
    return `${currency} ${(cents / 100).toLocaleString()}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold mt-1">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Usage */}
        {usage && (
          <section className="space-y-3">
            <h2 className="font-medium">Usage this period</h2>
            <p className="text-sm text-muted-foreground">
              Plan: {usage.plan?.name || "Trial / none"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <UsageCard label="Clients" value={usage.usage.clientsCount} warn={usage.limits?.clientsNearLimit} />
              <UsageCard label="Scans" value={usage.usage.scansUsed} warn={usage.limits?.scansNearLimit} />
              <UsageCard label="Prompts" value={usage.usage.promptsUsed} warn={usage.limits?.promptsNearLimit} />
              <UsageCard label="Seats" value={usage.usage.teamSeats} warn={usage.limits?.seatsNearLimit} />
            </div>
            {usage.limits &&
              (usage.limits.clientsNearLimit ||
                usage.limits.scansNearLimit ||
                usage.limits.seatsNearLimit) && (
                <p className="text-sm text-amber-700">
                  You are approaching plan limits. Consider upgrading.
                </p>
              )}
          </section>
        )}

        {/* Team */}
        <section className="space-y-4">
          <h2 className="font-medium">Team</h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="rounded-lg border bg-white p-3 flex justify-between text-sm">
                <span>{m.fullName || m.email}</span>
                <span className="text-muted-foreground">{m.role}</span>
              </div>
            ))}
          </div>

          {invites.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Pending invites</p>
              {invites.map((i) => (
                <div key={i.id} className="rounded-lg border bg-white p-3 text-sm flex justify-between">
                  <span>{i.email}</span>
                  <span className="text-muted-foreground">{i.role}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={sendInvite} className="flex flex-wrap gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@agency.com"
              className="rounded-md border px-3 py-2 text-sm flex-1 min-w-[200px]"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-md border px-2 py-2 text-sm"
            >
              <option value="AGENCY_MEMBER">Member</option>
              <option value="AGENCY_OWNER">Owner</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Invite
            </button>
          </form>
          {inviteUrl && (
            <p className="text-sm text-green-700 break-all">
              Invite link:{" "}
              <a href={inviteUrl} className="underline">
                {inviteUrl}
              </a>
            </p>
          )}
        </section>

        {/* Billing */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Billing</h2>
            <button
              onClick={openPortal}
              disabled={busy}
              className="text-sm underline disabled:opacity-50"
            >
              Manage subscription
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(usage?.plans || [])
              .filter((p) => p.region === "PAKISTAN" || p.region === "INTERNATIONAL")
              .slice(0, 6)
              .map((p) => (
                <div key={p.id} className="rounded-lg border bg-white p-4">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(p.priceMonthly, p.currency)}/mo · {p.region}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.maxClients} clients · {p.maxScansPerMonth} scans/mo
                  </p>
                  <button
                    onClick={() => checkout(p.slug)}
                    disabled={busy}
                    className="mt-3 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    {usage?.plan?.slug === p.slug ? "Current" : "Subscribe"}
                  </button>
                </div>
              ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Requires STRIPE_SECRET_KEY. Without Stripe, plans still display for reference.
          </p>
        </section>
      </main>
    </div>
  );
}

function UsageCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-white p-3 ${
      warn ? "border-amber-300" : ""
    }`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
