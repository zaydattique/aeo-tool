import { prisma } from "./prisma";

const DEFAULT_STALE_SCAN_MS = 15 * 60 * 1000;

export function staleScanThresholdMs(): number {
  const raw = Number.parseInt(
    process.env.SCAN_STALE_TIMEOUT_MS || String(DEFAULT_STALE_SCAN_MS),
    10
  );
  return Number.isFinite(raw)
    ? Math.min(60 * 60 * 1000, Math.max(2 * 60 * 1000, raw))
    : DEFAULT_STALE_SCAN_MS;
}

/**
 * Marks scans that have been RUNNING beyond the bounded worker timeout as
 * failed. The conditional update makes recovery safe against a worker that
 * finishes concurrently: only still-RUNNING rows are reclaimed.
 */
export async function recoverStaleScans(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - staleScanThresholdMs());

  const stale = await prisma.scan.findMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: cutoff },
    },
    select: { id: true, clientId: true },
    orderBy: [{ startedAt: "asc" }, { id: "asc" }],
    take: 100,
  });

  let recovered = 0;
  for (const scan of stale) {
    const result = await prisma.scan.updateMany({
      where: {
        id: scan.id,
        status: "RUNNING",
        startedAt: { lt: cutoff },
      },
      data: {
        status: "FAILED",
        stage: "FAILED",
        errorMessage: "Scan worker timed out or became unavailable",
        completedAt: now,
      },
    });

    if (result.count !== 1) continue;

    recovered += 1;

    await prisma.client.updateMany({
      where: {
        id: scan.clientId,
        status: "SCANNING",
      },
      data: { status: "ERROR" },
    });
  }

  return recovered;
}
