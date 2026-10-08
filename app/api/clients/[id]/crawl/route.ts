import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!canManageClients(auth.session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: clientId } = await params;
  const client = await prisma.client.findFirst({ where: { id: clientId, agencyId: auth.agencyId, deletedAt: null }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const url = new URL(req.url);
  const runId = url.searchParams.get("runId");
  const run = await prisma.crawlRun.findFirst({
    where: { agencyId: auth.agencyId, clientId, ...(runId ? { id: runId } : {}) },
    orderBy: { startedAt: "desc" },
    include: {
      pages: { orderBy: [{ depth: "asc" }, { url: "asc" }], take: 500 },
      issues: { orderBy: [{ severity: "asc" }, { createdAt: "desc" }], take: 1000 },
    },
  });
  if (!run) return NextResponse.json({ error: "No crawl found" }, { status: 404 });
  return NextResponse.json({ methodologyVersion: run.methodologyVersion, run });
}
