"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function ImpersonationBanner() {
  const { data: session, update } = useSession();
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const expiresAt = session?.user?.impersonationExpiresAt;
    if (session?.user?.role !== "SUPER_ADMIN" || !session.user.agencyId || !expiresAt) {
      setRemaining("");
      return;
    }

    const tick = () => {
      const seconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      const minutes = Math.floor(seconds / 60);
      const secs = String(seconds % 60).padStart(2, "0");
      setRemaining(`${minutes}:${secs}`);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session?.user?.agencyId, session?.user?.impersonationExpiresAt, session?.user?.role]);

  if (!session?.user || session.user.role !== "SUPER_ADMIN" || !session.user.agencyId || !session.user.impersonationExpiresAt) {
    return null;
  }

  async function stop() {
    await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agencyId: session?.user?.agencyId, stop: true }),
    });
    await update({ agencyId: null, agencyName: null, onboardingCompleted: true });
    window.location.href = "/admin";
  }

  return (
    <div role="alert" className="sticky top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <span>
          <strong>Impersonation active:</strong> {session.user.agencyName ?? "Agency"} · expires in {remaining}
        </span>
        <button type="button" onClick={stop} className="rounded border border-amber-700 px-3 py-1 text-xs font-medium">
          Stop impersonating
        </button>
      </div>
    </div>
  );
}
