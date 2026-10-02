import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { getCompetitorPromptSeeds } from "@/lib/default-prompts";
import { Prisma } from "@prisma/client";
import { readJsonBody } from "@/lib/request-security";

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

    let seeded = 0;
    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data: { competitors },
      });

      if (parsed.data.seedPrompts && competitors.length > 0) {
        const brand = client.brandName || client.name;
        const seeds = getCompetitorPromptSeeds(brand, competitors, client.location);
        const existing = await tx.trackedPrompt.findMany({
          where: {
            clientId,
            agencyId: auth.agencyId!,
            deletedAt: null,
            kind: "competitor",
          },
          select: { promptText: true },
        });
        const existingSet = new Set(existing.map((e) => e.promptText));
        const agency = await tx.agency.findUnique({
          where: { id: auth.agencyId! },
          include: { plan: true },
        });
        const maxPrompts = agency?.plan?.maxTrackedPrompts ?? Number.MAX_SAFE_INTEGER;
        const count = await tx.trackedPrompt.count({
          where: { agencyId: auth.agencyId!, deletedAt: null },
        });
        const remaining = Math.max(0, maxPrompts - count);
        const toCreate = seeds.filter((s) => !existingSet.has(s.promptText));
        if (toCreate.length > remaining) throw new Error("PROMPT_LIMIT_REACHED");
        if (toCreate.length) {
          await tx.trackedPrompt.createMany({
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

      await tx.activityLog.create({
        data: {
          agencyId: auth.agencyId!,
          actorId: auth.session!.user.id,
          action: "client.competitors.updated",
          resourceType: "client",
          resourceId: clientId,
          metadata: { competitors, seeded },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ competitors, seeded });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    if (err instanceof Error && err.message === "PROMPT_LIMIT_REACHED") return NextResponse.json({ error: "Prompt limit reached. Upgrade your plan." }, { status: 403 });
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") return NextResponse.json({ error: "Concurrent update detected. Please retry." }, { status: 409 });
    console.error("Competitors update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
