import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 50) || 50));
  const agencyId = req.nextUrl.searchParams.get("agencyId") || undefined;
  const role = req.nextUrl.searchParams.get("role") as "SUPER_ADMIN" | "AGENCY_OWNER" | "AGENCY_MEMBER" | undefined;

  const users = await prisma.user.findMany({
    where: { deletedAt: null, agencyId, role },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, email: true, fullName: true, role: true, agencyId: true, lastLoginAt: true, createdAt: true, mfaEnabled: true,
      agency: { select: { name: true, status: true } },
      _count: { select: { sessions: true, securityEvents: true } },
    },
  });

  return NextResponse.json({ users });
}
