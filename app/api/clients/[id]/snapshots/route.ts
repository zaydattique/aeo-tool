import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { checkPromptVisibility } from "@/lib/visibility-check";
import { getDefaultPromptSeeds } from "@/lib/default-prompts";

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
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  let prompts = await prisma.trackedPrompt.findMany({
    where: { clientId, agencyId: auth.agencyId, deletedAt: null },
  });

  if (prompts.length === 0) {
    const defaults = getDefaultPromptSeeds(
      client.brandName || client.name,
      client.location
    );
    await prisma.trackedPrompt.createMany({
      data: defaults.map((s) => ({
        agencyId: auth.agencyId!,
        clientId,
        promptText: s.promptText,
        isCustom: false,
        kind: s.kind,
        targetName: s.targetName || null,
      })),
    });
    prompts = await prisma.trackedPrompt.findMany({
      where: { clientId, deletedAt: null },
    });
  }

  const base =
    client.currentVisibilityScore != null
      ? client.currentVisibilityScore
      : 50;
  const brand = client.brandName || client.name;

  const created = [];
  let maxLive = 0;
  for (const prompt of prompts) {
    const check = await checkPromptVisibility({
      promptText: prompt.promptText,
      brandName: brand,
      baseScore: base,
      kind: prompt.kind || "brand",
      competitorName: prompt.targetName,
    });

    maxLive = Math.max(maxLive, check.liveEngineCount);

    const snapshot = await prisma.visibilitySnapshot.create({
      data: {
        agencyId: auth.agencyId,
        clientId,
        promptId: prompt.id,
        score: check.score,
        sources: {
          method: check.method,
          engines: check.engines,
          liveEngineCount: check.liveEngineCount,
          baseScore: base,
          brandMentioned: check.brandMentioned,
          competitorMentioned: check.competitorMentioned,
          kind: prompt.kind,
          targetName: prompt.targetName,
          recordedAt: new Date().toISOString(),
        },
      },
    });
    created.push({
      ...snapshot,
      score: Number(snapshot.score),
      engines: check.engines,
      liveEngineCount: check.liveEngineCount,
      method: check.method,
    });
  }

  await prisma.activityLog.create({
    data: {
      agencyId: auth.agencyId,
      actorId: auth.session.user.id,
      action: "visibility.snapshot_recorded",
      resourceType: "client",
      resourceId: clientId,
      metadata: { count: created.length, maxLiveEngines: maxLive },
    },
  });

  return NextResponse.json(
    { snapshots: created, maxLiveEngines: maxLive },
    { status: 201 }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const { id: clientId } = await params;

  const snapshots = await prisma.visibilitySnapshot.findMany({
    where: { clientId, agencyId },
    orderBy: { recordedAt: "asc" },
    include: {
      prompt: {
        select: { id: true, promptText: true, kind: true, targetName: true },
      },
    },
  });

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      ...s,
      score: Number(s.score),
    })),
  });
}
