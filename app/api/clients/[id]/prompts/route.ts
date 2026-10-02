import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { getDefaultPromptSeeds } from "@/lib/default-prompts";
import { computeSov } from "@/lib/sov";
import { readJsonBody } from "@/lib/request-security";

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
    const body = await readJsonBody<unknown>(req);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.findUnique({
        where: { id: auth.agencyId },
        include: { plan: true },
      });
      const maxPrompts = agency?.plan?.maxTrackedPrompts ?? Number.MAX_SAFE_INTEGER;
      const existingCount = await tx.trackedPrompt.count({
        where: { agencyId: auth.agencyId!, deletedAt: null },
      });

      if (parsed.data.seedDefaults) {
        const clientPromptCount = await tx.trackedPrompt.count({
          where: { clientId, agencyId: auth.agencyId!, deletedAt: null },
        });
        if (clientPromptCount === 0) {
          const defaults = getDefaultPromptSeeds(client.brandName || client.name, client.location);
          const selected = defaults.slice(0, Math.max(0, maxPrompts - existingCount));
          if (selected.length < defaults.length && existingCount + defaults.length > maxPrompts) {
            throw new Error("PROMPT_LIMIT_REACHED");
          }
          if (selected.length > 0) {
            await tx.trackedPrompt.createMany({
              data: selected.map((s) => ({
                agencyId: auth.agencyId!,
                clientId,
                promptText: s.promptText,
                isCustom: false,
                kind: s.kind,
                targetName: s.targetName || null,
              })),
            });
          }
          return { seeded: true };
        }
      }

      if (existingCount >= maxPrompts) {
        throw new Error("PROMPT_LIMIT_REACHED");
      }

      const prompt = await tx.trackedPrompt.create({
        data: {
          agencyId: auth.agencyId!,
          clientId,
          promptText: parsed.data.promptText.trim(),
          isCustom: true,
          kind: parsed.data.kind || "brand",
          targetName: parsed.data.targetName?.trim() || null,
        },
      });
      return { seeded: false, prompt };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (result.seeded) {
      const prompts = await prisma.trackedPrompt.findMany({
        where: { clientId, agencyId: auth.agencyId!, deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 200,
      });
      return NextResponse.json({ prompts }, { status: 201 });
    }

    return NextResponse.json({ prompt: result.prompt }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    if (err instanceof Error && err.message === "PROMPT_LIMIT_REACHED") return NextResponse.json({ error: "Prompt limit reached. Upgrade your plan." }, { status: 403 });
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") return NextResponse.json({ error: "Concurrent prompt creation detected. Please retry." }, { status: 409 });
    console.error("Create prompt error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
