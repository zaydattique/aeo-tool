import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">AEO Command</h1>
            <p className="text-sm text-muted-foreground">
              {session.user.agencyName || "Your agency"}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {session.user.name || session.user.email}
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
              {session.user.role}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-muted-foreground hover:underline"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">Welcome to your dashboard</h2>
          <p className="mt-2 text-muted-foreground">
            Auth and onboarding are live. Client management and scans come in
            Phase 4.
          </p>
          <div className="mt-6 text-sm text-muted-foreground">
            <p>Agency ID: {session.user.agencyId || "—"}</p>
            <p>Role: {session.user.role}</p>
            <p>
              Onboarding:{" "}
              {session.user.onboardingCompleted ? "Complete" : "Pending"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
