import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const { id: clientId } = await params;

  const reports = await prisma.report.findMany({
    where: { clientId, agencyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ reports });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!canManageClients(auth.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId: auth.agencyId, deletedAt: null },
    include: {
      agency: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          brandColors: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const latestScan = await prisma.scan.findFirst({
    where: { clientId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  const actions = await prisma.action.findMany({
    where: { clientId, agencyId: auth.agencyId, deletedAt: null },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  const prompts = await prisma.trackedPrompt.findMany({
    where: { clientId, deletedAt: null },
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 5,
      },
    },
  });

  const token = randomBytes(24).toString("hex");

  const analysis = (latestScan?.aiAnalysis as Record<string, unknown>) || null;

  const report = await prisma.report.create({
    data: {
      agencyId: auth.agencyId,
      clientId,
      generatedById: auth.session.user.id,
      liveLinkToken: token,
      config: {
        agencyName: client.agency.name,
        agencyLogoUrl: client.agency.logoUrl,
        brandColors: client.agency.brandColors,
        clientName: client.name,
        websiteUrl: client.websiteUrl,
        visibilityScore: client.currentVisibilityScore,
        generatedAt: new Date().toISOString(),
        analysis,
        actions: actions.map((a) => ({
          priority: a.priority,
          category: a.category,
          title: a.title,
          whyItMatters: a.whyItMatters,
          status: a.status,
          effortLevel: a.effortLevel,
          suggestedText: a.suggestedText,
        })),
        prompts: prompts.map((p) => ({
          promptText: p.promptText,
          latestScore:
            p.snapshots[0] != null ? Number(p.snapshots[0].score) : null,
        })),
        sections: [
          "summary",
          "scores",
          "actions",
          "visibility",
        ],
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      agencyId: auth.agencyId,
      actorId: auth.session.user.id,
      action: "report.generated",
      resourceType: "report",
      resourceId: report.id,
      metadata: { clientId, token },
    },
  });

  return NextResponse.json(
    {
      report,
      liveUrl: `/r/${token}`,
    },
    { status: 201 }
  );
}
