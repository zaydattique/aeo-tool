import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { checkPromptVisibility } from "@/lib/visibility-check";

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
    const { getDefaultPrompts } = await import("@/lib/default-prompts");
    const defaults = getDefaultPrompts(
      client.brandName || client.name,
      client.location
    );
    await prisma.trackedPrompt.createMany({
      data: defaults.map((promptText) => ({
        agencyId: auth.agencyId!,
        clientId,
        promptText,
        isCustom: false,
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
  for (const prompt of prompts) {
    const check = await checkPromptVisibility({
      promptText: prompt.promptText,
      brandName: brand,
      baseScore: base,
    });

    const snapshot = await prisma.visibilitySnapshot.create({
      data: {
        agencyId: auth.agencyId,
        clientId,
        promptId: prompt.id,
        score: check.score,
        sources: {
          method: check.method,
          engines: check.engines,
          baseScore: base,
          recordedAt: new Date().toISOString(),
        },
      },
    });
    created.push({
      ...snapshot,
      score: Number(snapshot.score),
      engines: check.engines,
    });
  }

  await prisma.activityLog.create({
    data: {
      agencyId: auth.agencyId,
      actorId: auth.session.user.id,
      action: "visibility.snapshot_recorded",
      resourceType: "client",
      resourceId: clientId,
      metadata: {
        count: created.length,
        methods: [...new Set(created.map((c) => c.engines))],
      },
    },
  });

  return NextResponse.json({ snapshots: created }, { status: 201 });
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
      prompt: { select: { id: true, promptText: true } },
    },
  });

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      ...s,
      score: Number(s.score),
    })),
  });
}
