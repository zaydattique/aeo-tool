import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, Math.floor(rawLimit))) : 100;
  const rawOffset = Number(req.nextUrl.searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;

  const members = await prisma.user.findMany({
    where: { agencyId, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
    orderBy: { fullName: "asc" },
    skip: offset,
    take: limit + 1,
  });

  const hasMore = members.length > limit;
  members.splice(limit);

  return NextResponse.json({ members, pagination: { offset, limit, hasMore } });
}
