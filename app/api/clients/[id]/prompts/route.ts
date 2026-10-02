import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { getDefaultPromptSeeds } from "@/lib/default-prompts";
import { computeSov } from "@/lib/sov";

const createSchema = z.object({
  promptText: z.string().min(3).max(500),
  seedDefaults: z.boolean().optional(),
  kind: z.enum(["brand", "category", "competitor"]).optional(),
  targetName: z.string().max(120).optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const { id: clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId, deletedAt: null },
    select: { id: true, competitors: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const prompts = await prisma.trackedPrompt.findMany({
    where: { clientId, agencyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 10,
      },
    },
  });

  const mapped = prompts.map((p) => {
    const latest = p.snapshots[0];
    const sources = (latest?.sources as {
      brandMentioned?: boolean;
      competitorMentioned?: boolean;
    } | null) || null;
    return {
      ...p,
      snapshots: p.snapshots.map((s) => ({
        ...s,
        score: Number(s.score),
      })),
      latestScore: latest != null ? Number(latest.score) : null,
      brandMentioned: sources?.brandMentioned ?? null,
      competitorMentioned: sources?.competitorMentioned ?? null,
    };
  });

  const sov = computeSov(
    mapped.map((p) => ({
      id: p.id,
      promptText: p.promptText,
      kind: p.kind || "brand",
      targetName: p.targetName,
      latestScore: p.latestScore,
      brandMentioned: p.brandMentioned,
      competitorMentioned: p.competitorMentioned,
    }))
  );

  return NextResponse.json({
    prompts: mapped,
    competitors: client.competitors || [],
    sov,
  });
}

export async function POST(
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
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (parsed.data.seedDefaults) {
      const existing = await prisma.trackedPrompt.count({
        where: { clientId, agencyId: auth.agencyId, deletedAt: null },
      });
      if (existing === 0) {
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
        const prompts = await prisma.trackedPrompt.findMany({
          where: { clientId, agencyId: auth.agencyId, deletedAt: null },
          orderBy: { createdAt: "asc" },
        });
        return NextResponse.json({ prompts }, { status: 201 });
      }
    }

    const agency = await prisma.agency.findUnique({
      where: { id: auth.agencyId },
      include: { plan: true },
    });
    if (agency?.plan) {
      const count = await prisma.trackedPrompt.count({
        where: { agencyId: auth.agencyId, deletedAt: null },
      });
      if (count >= agency.plan.maxTrackedPrompts) {
        return NextResponse.json(
          {
            error: `Prompt limit reached (${agency.plan.maxTrackedPrompts}). Upgrade your plan.`,
          },
          { status: 403 }
        );
      }
    }

    const prompt = await prisma.trackedPrompt.create({
      data: {
        agencyId: auth.agencyId,
        clientId,
        promptText: parsed.data.promptText.trim(),
        isCustom: true,
        kind: parsed.data.kind || "brand",
        targetName: parsed.data.targetName?.trim() || null,
      },
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "PROMPT_LIMIT_REACHED") return NextResponse.json({ error: "Prompt limit reached. Upgrade your plan." }, { status: 403 });
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") return NextResponse.json({ error: "Concurrent prompt creation detected. Please retry." }, { status: 409 });
    console.error("Create prompt error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
