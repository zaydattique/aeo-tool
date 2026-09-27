import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/session";

export async function GET() {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const members = await prisma.user.findMany({
    where: { agencyId, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ members });
}
