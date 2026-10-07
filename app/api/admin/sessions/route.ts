import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 50) || 50));
  const agencyId = req.nextUrl.searchParams.get("agencyId") || undefined;
  const userId = req.nextUrl.searchParams.get("userId") || undefined;

  const sessions = await prisma.userSession.findMany({
    where: { agencyId, userId },
    orderBy: { lastActiveAt: "desc" },
    take: limit,
    select: {
      id: true, userId: true, agencyId: true, issuedAt: true, expiresAt: true, lastActiveAt: true, revokedAt: true, ip: true, userAgent: true,
      user: { select: { email: true, fullName: true, role: true } },
      agency: { select: { name: true } },
    },
  });

  return NextResponse.json({ sessions });
}
