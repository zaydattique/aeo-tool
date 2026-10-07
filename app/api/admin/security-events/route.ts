import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 50) || 50));
  const eventType = req.nextUrl.searchParams.get("eventType") || undefined;
  const severity = req.nextUrl.searchParams.get("severity") || undefined;
  const agencyId = req.nextUrl.searchParams.get("agencyId") || undefined;

  const events = await prisma.securityEvent.findMany({
    where: { eventType, severity, agencyId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, eventType: true, severity: true, targetType: true, targetId: true, ip: true, userAgent: true, metadata: true, createdAt: true,
      user: { select: { email: true, fullName: true, role: true } },
      agency: { select: { name: true } },
    },
  });

  return NextResponse.json({ events });
}
