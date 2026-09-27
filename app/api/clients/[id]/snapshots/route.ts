import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";

/**
 * POST — Record a visibility check for all active prompts on a client.
 * Uses current client visibility score ± variance as MVP estimate.
 * Real multi-engine citation checks can replace this later.
 */
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

  // Auto-seed defaults if none
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

  const created = [];
  for (const prompt of prompts) {
    // Deterministic-ish variance per prompt for demo realism
    const hash = prompt.id
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    const variance = ((hash + Date.now() / 100000) % 21) - 10;
    const score = Math.max(0, Math.min(100, Math.round(base + variance)));

    const snapshot = await prisma.visibilitySnapshot.create({
      data: {
        agencyId: auth.agencyId,
        clientId,
        promptId: prompt.id,
        score,
        sources: {
          method: "estimated",
          note: "MVP estimate from scan visibility ± variance. Real engine checks coming later.",
          baseScore: base,
        },
      },
    });
    created.push({ ...snapshot, score: Number(snapshot.score) });
  }

  await prisma.activityLog.create({
    data: {
      agencyId: auth.agencyId,
      actorId: auth.session.user.id,
      action: "visibility.snapshot_recorded",
      resourceType: "client",
      resourceId: clientId,
      metadata: { count: created.length },
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
