import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { enqueueSimulatedScan } from "@/lib/scan-worker";
import { rateLimit } from "@/lib/rate-limit";
import { admitScan } from "@/lib/scan-admission";
import { scanAgencyBacklogLimit, scanGlobalBacklogLimit, scanAdmissionLockTimeoutMs } from "@/lib/visibility-config";

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
  const rl = await rateLimit(`scan:${auth.agencyId}`, 10, 10 * 60 * 1000);
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

  const agency = await prisma.agency.findUnique({
    where: { id: auth.agencyId },
    include: { plan: true },
  });

  const scanAdmission = await prisma.$transaction((tx) =>
    admitScan(
      tx,
      {
        agencyId: auth.agencyId!,
        clientId,
        websiteUrl: client.websiteUrl,
        actorId: auth.session!.user.id,
        maxScansPerMonth: agency?.plan?.maxScansPerMonth ?? null,
      },
      {
        globalBacklogLimit: scanGlobalBacklogLimit(),
        agencyBacklogLimit: scanAgencyBacklogLimit(),
        lockTimeoutMs: scanAdmissionLockTimeoutMs(),
      }
    )
  );

  if (scanAdmission.reason === "ACTIVE_SCAN") {
    const activeScan = await prisma.scan.findFirst({
      where: {
        clientId,
        agencyId: auth.agencyId,
        status: { in: ["QUEUED", "RUNNING"] },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(
      {
        error: "A scan is already in progress for this client",
        scanId: activeScan?.id,
      },
      { status: 409 }
    );
  }

  if (scanAdmission.reason === "MONTHLY_QUOTA") {
    return NextResponse.json(
      {
        error: `Monthly scan limit reached (${agency?.plan?.maxScansPerMonth}). Upgrade your plan.`,
      },
      { status: 403 }
    );
  }

  if (scanAdmission.reason === "GLOBAL_BACKLOG" || scanAdmission.reason === "AGENCY_BACKLOG") {
    return NextResponse.json(
      {
        error: "Scan queue is currently full. Please retry shortly.",
        retryable: true,
      },
      { status: 429, headers: { "Retry-After": "30" } }
    );
  }

  const scan = scanAdmission.scan!;

  enqueueSimulatedScan(scan.id);

  return NextResponse.json({ scan }, { status: 201 });
}
