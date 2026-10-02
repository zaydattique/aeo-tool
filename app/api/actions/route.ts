import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/session";
import { ActionStatus, ActionPriority, ActionCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const sp = req.nextUrl.searchParams;
  const clientId = sp.get("clientId") || undefined;
  const statusFilter = sp.get("status") || undefined;
  const priorityFilter = sp.get("priority") || undefined;
  const categoryFilter = sp.get("category") || undefined;
  const rawLimit = Number.parseInt(sp.get("limit") || "100", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, rawLimit)) : 100;

  const where: {
    agencyId: string;
    deletedAt: null;
    clientId?: string;
    status?: ActionStatus;
    priority?: ActionPriority;
    category?: ActionCategory;
  } = {
    agencyId,
    deletedAt: null,
  };

  if (clientId) where.clientId = clientId;
  if (statusFilter && ["TODO", "IN_PROGRESS", "DONE", "SKIPPED"].includes(statusFilter)) {
    where.status = statusFilter as ActionStatus;
  }
  if (priorityFilter && ["HIGH", "MEDIUM", "LOW"].includes(priorityFilter)) {
    where.priority = priorityFilter as ActionPriority;
  }
  if (
    categoryFilter &&
    ["TECHNICAL", "CONTENT", "SCHEMA", "ENTITY", "AUTHORITY", "PERFORMANCE", "OTHER"].includes(
      categoryFilter
    )
  ) {
    where.category = categoryFilter as ActionCategory;
  }

  const actions = await prisma.action.findMany({
    where,
    take: limit + 1,
    orderBy: [
      { priority: "asc" }, // HIGH first if we map carefully — Prisma enums order by definition
      { createdAt: "desc" },
    ],
    include: {
      assignedTo: {
        select: { id: true, fullName: true, email: true },
      },
      completedBy: {
        select: { id: true, fullName: true },
      },
      client: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = actions.length > limit;
  if (hasMore) actions.splice(limit);

  // Sort HIGH → MEDIUM → LOW manually (Prisma enum order is definition order)
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  actions.sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
  );

  return NextResponse.json({ actions, hasMore });
}
