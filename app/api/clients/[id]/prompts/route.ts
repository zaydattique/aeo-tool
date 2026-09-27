import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { getDefaultPrompts } from "@/lib/default-prompts";

const createSchema = z.object({
  promptText: z.string().min(3).max(500),
  seedDefaults: z.boolean().optional(),
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
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const prompts = await prisma.trackedPrompt.findMany({
    where: { clientId, agencyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      snapshots: {
        orderBy: { recordedAt: "desc" },
        take: 30,
      },
    },
  });

  return NextResponse.json({
    prompts: prompts.map((p) => ({
      ...p,
      snapshots: p.snapshots.map((s) => ({
        ...s,
        score: Number(s.score),
      })),
    })),
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

    // Seed defaults if requested and none exist
    if (parsed.data.seedDefaults) {
      const existing = await prisma.trackedPrompt.count({
        where: { clientId, deletedAt: null },
      });
      if (existing === 0) {
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
        const prompts = await prisma.trackedPrompt.findMany({
          where: { clientId, deletedAt: null },
          orderBy: { createdAt: "asc" },
        });
        return NextResponse.json({ prompts }, { status: 201 });
      }
    }

    // Plan limit
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
      },
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (err) {
    console.error("Create prompt error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
