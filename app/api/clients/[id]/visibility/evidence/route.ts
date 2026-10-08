import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";

const MAX_PAGE_SIZE = 100;

export async function GET(
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
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const url = new URL(req.url);
  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isInteger(rawLimit) ? Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit)) : 50;
  const cursor = url.searchParams.get("cursor") || undefined;
  const engine = url.searchParams.get("engine") || undefined;

  const rows = await prisma.promptEngineObservation.findMany({
    where: {
      clientId,
      agencyId: auth.agencyId,
      ...(engine ? { engine } : {}),
    },
    orderBy: [{ observedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      prompt: { select: { promptText: true, kind: true, targetName: true } },
      response: {
        select: {
          id: true,
          model: true,
          state: true,
          confidence: true,
          answerText: true,
          answerHash: true,
          citationsExtracted: true,
          observedAt: true,
          citations: {
            orderBy: { position: "asc" },
            select: { url: true, domain: true, position: true, title: true },
          },
        },
      },
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return NextResponse.json({
    methodologyVersion: "4.0",
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  });
}
