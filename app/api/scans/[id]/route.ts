import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const { id } = await params;

  const scan = await prisma.scan.findFirst({
    where: { id, agencyId },
    select: {
      id: true,
      clientId: true,
      status: true,
      stage: true,
      progress: true,
      startedAt: true,
      completedAt: true,
      errorMessage: true,
      aiAnalysis: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
          websiteUrl: true,
          currentVisibilityScore: true,
        },
      },
    },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json({ scan });
}
