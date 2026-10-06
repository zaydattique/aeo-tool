"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [setup, setSetup] = useState<{ token: string; secret: string; uri: string } | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        totpCode: !useRecovery ? mfaCode : undefined,
        recoveryCode: useRecovery ? mfaCode : undefined,
        redirect: false,
      });

      if (res?.error === "MFASetupRequired") {
        const setupRes = await fetch("/api/auth/mfa/setup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await setupRes.json();
        if (!setupRes.ok) {
          setError(data.error ?? "Unable to start MFA setup.");
        } else {
          setSetup({ token: data.setupToken, secret: data.secret, uri: data.otpauthUri });
          setError("Your account requires MFA. Add the secret to an authenticator app, then verify the code below.");
        }
        setLoading(false);
        return;
      }

      if (res?.error === "MFARequired") {
        setError("Enter the code from your authenticator app or use a recovery code.");
        setLoading(false);
        return;
      }

      if (res?.error === "AgencySuspended") {
        setError("Your agency has been suspended. Contact support.");
        setLoading(false);
        return;
      }

      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to Threezero AEO</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your clients' AI visibility
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@agency.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {setup ? (
            <div className="rounded-md border p-4 text-sm space-y-3" role="status">
              <p className="font-medium">Set up your authenticator</p>
              <p>Secret: <code className="break-all">{setup.secret}</code></p>
              <p className="break-all text-xs text-muted-foreground">OTP URI: {setup.uri}</p>
              <label htmlFor="setup-code" className="block font-medium">Authenticator code</label>
              <input id="setup-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={setupCode} onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))} className="w-full rounded-md border px-3 py-2 text-sm" />
              <button type="button" disabled={loading || setupCode.length !== 6} onClick={async () => {
                setLoading(true); setError("");
                const response = await fetch("/api/auth/mfa/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ setupToken: setup.token, code: setupCode }) });
                const data = await response.json();
                if (!response.ok) { setError(data.error ?? "Invalid code"); setLoading(false); return; }
                setRecoveryCodes(data.recoveryCodes);
                setSetup(null); setMfaCode(""); setUseRecovery(false); setError("MFA enabled. Save your recovery codes, then sign in with your authenticator code."); setLoading(false);
              }} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Verify and enable MFA</button>
            </div>
          ) : null}

          {recoveryCodes ? (
            <div className="rounded-md border p-4 text-sm" role="alert">
              <p className="font-medium">Save these recovery codes</p>
              <p className="mt-1 text-muted-foreground">Each code works once. Store them somewhere secure.</p>
              <code className="mt-2 block whitespace-pre-wrap">{recoveryCodes.join("\n")}</code>
            </div>
          ) : null}

          {(mfaCode || error.includes("MFA")) && !setup ? (
            <div>
              <label htmlFor="mfa-code" className="block text-sm font-medium">{useRecovery ? "Recovery code" : "Authenticator code"}</label>
              <input id="mfa-code" inputMode={useRecovery ? "text" : "numeric"} autoComplete="one-time-code" value={mfaCode} onChange={(e) => setMfaCode(useRecovery ? e.target.value : e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder={useRecovery ? "XXXXXXXX-XXXXXXXX" : "123456"} />
              <button type="button" onClick={() => { setUseRecovery(!useRecovery); setMfaCode(""); }} className="mt-2 text-xs underline">{useRecovery ? "Use authenticator code" : "Use a recovery code"}</button>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium underline">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
