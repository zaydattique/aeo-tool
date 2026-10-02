import { PrismaClient } from "@prisma/client";

export type ScanAdmissionReason =
  | "ACTIVE_SCAN"
  | "MONTHLY_QUOTA"
  | "GLOBAL_BACKLOG"
  | "AGENCY_BACKLOG";

export type ScanAdmissionResult = {
  scan: Awaited<ReturnType<PrismaClient["scan"]["create"]>> | null;
  reason: ScanAdmissionReason | null;
};

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

const LOCK_NAMESPACE = 0x5343414e; // "SCAN" namespace for advisory lock pairs

function nextMonthRescanDate(intervalDays: number): Date {
  return new Date(Date.now() + intervalDays * 86400000);
}

/**
 * Admission gate for all scan creation paths.
 *
 * The global advisory lock makes the bounded backlog check authoritative across
 * horizontally scaled app instances. The transaction is intentionally short:
 * it only checks indexed counters/quotas and creates the queue row.
 */
export async function admitScan(
  tx: Tx,
  input: {
    agencyId: string;
    clientId: string;
    websiteUrl?: string;
    actorId?: string;
    maxScansPerMonth?: number | null;
    rescanIntervalDays?: number;
    updateNextRescanAt?: boolean;
  },
  limits: {
    globalBacklogLimit: number;
    agencyBacklogLimit: number;
    lockTimeoutMs: number;
  }
): Promise<ScanAdmissionResult> {
  await tx.$executeRawUnsafe(
    `SET LOCAL lock_timeout = '${Math.max(100, Math.min(10_000, Math.floor(limits.lockTimeoutMs)))}ms'`
  );

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_NAMESPACE}, 0)`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_NAMESPACE}, hashtext(${input.agencyId}))`;

  const globalPending = await tx.scan.count({
    where: { status: { in: ["QUEUED", "RUNNING"] } },
  });
  if (globalPending >= limits.globalBacklogLimit) {
    return { scan: null, reason: "GLOBAL_BACKLOG" };
  }

  const agencyPending = await tx.scan.count({
    where: {
      agencyId: input.agencyId,
      status: { in: ["QUEUED", "RUNNING"] },
    },
  });
  if (agencyPending >= limits.agencyBacklogLimit) {
    return { scan: null, reason: "AGENCY_BACKLOG" };
  }

  const activeScan = await tx.scan.findFirst({
    where: {
      clientId: input.clientId,
      agencyId: input.agencyId,
      status: { in: ["QUEUED", "RUNNING"] },
    },
    orderBy: { createdAt: "asc" },
  });
  if (activeScan) {
    return { scan: null, reason: "ACTIVE_SCAN" };
  }

  if (input.maxScansPerMonth != null) {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const scansThisMonth = await tx.scan.count({
      where: {
        agencyId: input.agencyId,
        createdAt: { gte: periodStart },
        status: { not: "FAILED" },
      },
    });

    if (scansThisMonth >= input.maxScansPerMonth) {
      return { scan: null, reason: "MONTHLY_QUOTA" };
    }
  }

  const scan = await tx.scan.create({
    data: {
      agencyId: input.agencyId,
      clientId: input.clientId,
      status: "QUEUED",
      stage: "QUEUED",
      progress: 0,
    },
  });

  const clientData: { status: "SCANNING"; nextRescanAt?: Date } = {
    status: "SCANNING",
  };
  if (input.updateNextRescanAt) {
    clientData.nextRescanAt = nextMonthRescanDate(input.rescanIntervalDays ?? 7);
  }

  await tx.client.update({
    where: { id: input.clientId },
    data: clientData,
  });

  if (input.actorId) {
    await tx.activityLog.create({
      data: {
        agencyId: input.agencyId,
        actorId: input.actorId,
        action: "scan.started",
        resourceType: "scan",
        resourceId: scan.id,
        metadata: {
          clientId: input.clientId,
          websiteUrl: input.websiteUrl,
        },
      },
    });
  }

  return { scan, reason: null };
}
