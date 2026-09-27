import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClientList } from "./client-list";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.agencyId) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    where: { agencyId: session.user.agencyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      brandName: true,
      location: true,
      currentVisibilityScore: true,
      lastScannedAt: true,
      status: true,
      createdAt: true,
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          stage: true,
          progress: true,
        },
      },
    },
  });

  const serialized = clients.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    lastScannedAt: c.lastScannedAt?.toISOString() ?? null,
  }));

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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <ClientList initialClients={serialized} />
      </main>
    </div>
  );
}
