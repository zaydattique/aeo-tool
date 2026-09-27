import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { enqueueSimulatedScan } from "@/lib/scan-worker";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!canManageClients(auth.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Burst protection: max 10 scan starts per agency per 10 minutes
  const rl = rateLimit(`scan:${auth.agencyId}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many scans started. Wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { id: clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId: auth.agencyId, deletedAt: null },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const activeScan = await prisma.scan.findFirst({
    where: {
      clientId,
      agencyId: auth.agencyId,
      status: { in: ["QUEUED", "RUNNING"] },
    },
  });

  if (activeScan) {
    return NextResponse.json(
      {
        error: "A scan is already in progress for this client",
        scanId: activeScan.id,
      },
      { status: 409 }
    );
  }

  const agency = await prisma.agency.findUnique({
    where: { id: auth.agencyId },
    include: { plan: true },
  });

  if (agency?.plan) {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const scansThisMonth = await prisma.scan.count({
      where: {
        agencyId: auth.agencyId,
        createdAt: { gte: periodStart },
        status: { not: "FAILED" },
      },
    });

    if (scansThisMonth >= agency.plan.maxScansPerMonth) {
      return NextResponse.json(
        {
          error: `Monthly scan limit reached (${agency.plan.maxScansPerMonth}). Upgrade your plan.`,
        },
        { status: 403 }
      );
    }
  }

  const scan = await prisma.$transaction(async (tx) => {
    const newScan = await tx.scan.create({
      data: {
        agencyId: auth.agencyId!,
        clientId,
        status: "QUEUED",
        stage: "QUEUED",
        progress: 0,
      },
    });

    await tx.client.update({
      where: { id: clientId },
      data: { status: "SCANNING" },
    });

    await tx.activityLog.create({
      data: {
        agencyId: auth.agencyId!,
        actorId: auth.session!.user.id,
        action: "scan.started",
        resourceType: "scan",
        resourceId: newScan.id,
        metadata: { clientId, websiteUrl: client.websiteUrl },
      },
    });

    return newScan;
  });

  enqueueSimulatedScan(scan.id);

  return NextResponse.json({ scan }, { status: 201 });
}
