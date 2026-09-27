import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClientActions } from "./client-actions";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) redirect("/login");

  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: {
      id,
      agencyId: session.user.agencyId,
      deletedAt: null,
    },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to clients
            </Link>
            <h1 className="text-lg font-semibold mt-1">{client.name}</h1>
            <a
              href={client.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:underline"
            >
              {client.websiteUrl}
            </a>
          </div>
          <ClientActions
            clientId={client.id}
            initialStatus={client.status}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Visibility score"
            value={
              client.currentVisibilityScore != null
                ? `${client.currentVisibilityScore}/100`
                : "—"
            }
          />
          <StatCard
            label="Status"
            value={client.status.toLowerCase()}
          />
          <StatCard
            label="Last scanned"
            value={
              client.lastScannedAt
                ? new Date(client.lastScannedAt).toLocaleString()
                : "Never"
            }
          />
        </div>

        {client.brandName && (
          <p className="text-sm text-muted-foreground">
            Brand: {client.brandName}
            {client.location ? ` · ${client.location}` : ""}
          </p>
        )}

        {client.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {client.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        <div>
          <h2 className="font-medium mb-3">Scan history</h2>
          {client.scans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scans yet. Click "Start scan" to begin.
            </p>
          ) : (
            <div className="space-y-2">
              {client.scans.map((scan) => (
                <div
                  key={scan.id}
                  className="rounded-lg border bg-white p-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{scan.status}</span>
                    <span className="text-muted-foreground">
                      {" · "}{scan.stage} · {scan.progress}%
                    </span>
                    {scan.errorMessage && (
                      <p className="text-red-600 text-xs mt-1">
                        {scan.errorMessage}
                      </p>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(scan.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1 capitalize">{value}</p>
    </div>
  );
}
