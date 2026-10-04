import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { recordSecurityEvent, requestIp, requestUserAgent } from "@/lib/security-events";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error || !auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sessions = await prisma.userSession.findMany({
    where: { userId: auth.session.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
    select: { id: true, issuedAt: true, expiresAt: true, lastActiveAt: true, ip: true, userAgent: true, tokenId: true },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      issuedAt: s.issuedAt,
      expiresAt: s.expiresAt,
      lastActiveAt: s.lastActiveAt,
      ip: s.ip,
      userAgent: s.userAgent,
      current: s.tokenId === auth.session!.user.sessionId,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error || !auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Session id is required" }, { status: 400 });

  const session = await prisma.userSession.findFirst({ where: { id, userId: auth.session.user.id, revokedAt: null } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  await prisma.userSession.update({ where: { id }, data: { revokedAt: new Date() } });
  await recordSecurityEvent({ userId: auth.session.user.id, agencyId: auth.session.user.agencyId, eventType: "auth.session_revoked", targetType: "session", targetId: id, ip: requestIp(req), userAgent: requestUserAgent(req) });
  return NextResponse.json({ revoked: true });
}
