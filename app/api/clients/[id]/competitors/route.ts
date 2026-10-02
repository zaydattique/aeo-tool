import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { getCompetitorPromptSeeds } from "@/lib/default-prompts";

const schema = z.object({
  competitors: z.array(z.string().min(1).max(120)).max(15),
  seedPrompts: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, agencyId, deletedAt: null },
    select: { id: true, competitors: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ competitors: client.competitors || [] });
}

export async function PUT(
  req: NextRequest,
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

  try {
    const parsed = schema.safeParse(await readJsonBody<unknown>(req));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const competitors = [
      ...new Set(
        parsed.data.competitors
          .map((c) => c.trim())
          .filter(Boolean)
          .slice(0, 15)
      ),
    ];

    await prisma.client.update({
      where: { id: clientId },
      data: { competitors },
    });

    let seeded = 0;

    if (parsed.data.seedPrompts && competitors.length > 0) {
      const brand = client.brandName || client.name;
      const seeds = getCompetitorPromptSeeds(
        brand,
        competitors,
        client.location
      );

      const existing = await prisma.trackedPrompt.findMany({
        where: {
          clientId,
          agencyId: auth.agencyId,
          deletedAt: null,
          kind: "competitor",
        },
        select: { promptText: true },
      });
      const existingSet = new Set(existing.map((e) => e.promptText));

      const agency = await prisma.agency.findUnique({
        where: { id: auth.agencyId },
        include: { plan: true },
      });
      let remaining = 999;
      if (agency?.plan) {
        const count = await prisma.trackedPrompt.count({
          where: { agencyId: auth.agencyId, deletedAt: null },
        });
        remaining = Math.max(0, agency.plan.maxTrackedPrompts - count);
      }

      const toCreate = seeds
        .filter((s) => !existingSet.has(s.promptText))
        .slice(0, remaining);

      if (toCreate.length > 0) {
        await prisma.trackedPrompt.createMany({
          data: toCreate.map((s) => ({
            agencyId: auth.agencyId!,
            clientId,
            promptText: s.promptText,
            isCustom: false,
            kind: s.kind,
            targetName: s.targetName || null,
          })),
        });
        seeded = toCreate.length;
      }
    }

    await prisma.activityLog.create({
      data: {
        agencyId: auth.agencyId,
        actorId: auth.session.user.id,
        action: "client.competitors.updated",
        resourceType: "client",
        resourceId: clientId,
        metadata: { competitors, seeded },
      },
    });

    return NextResponse.json({ competitors, seeded });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    console.error("Competitors update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
