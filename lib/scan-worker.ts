import { prisma } from "./prisma";
import { ScanStage, ScanStatus, ClientStatus } from "@prisma/client";

/**
 * Simulated scan pipeline for Phase 4.
 * Advances through stages with delays. Real crawl + AI comes in Phase 5.
 *
 * Stages: QUEUED → CRAWL → EXTRACT → AI_ANALYSIS → ACTION_GENERATION → COMPLETED
 */

const STAGES: { stage: ScanStage; progress: number; delayMs: number }[] = [
  { stage: "CRAWL", progress: 20, delayMs: 1500 },
  { stage: "EXTRACT", progress: 40, delayMs: 1200 },
  { stage: "AI_ANALYSIS", progress: 65, delayMs: 2000 },
  { stage: "ACTION_GENERATION", progress: 85, delayMs: 1500 },
  { stage: "COMPLETED", progress: 100, delayMs: 500 },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runSimulatedScan(scanId: string) {
  try {
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "RUNNING",
        stage: "CRAWL",
        progress: 5,
        startedAt: new Date(),
      },
    });

    for (const step of STAGES) {
      await sleep(step.delayMs);

      // Check if scan was cancelled/deleted mid-run
      const current = await prisma.scan.findUnique({
        where: { id: scanId },
        select: { status: true },
      });
      if (!current || current.status === "FAILED") {
        return;
      }

      if (step.stage === "COMPLETED") {
        await prisma.scan.update({
          where: { id: scanId },
          data: {
            status: "COMPLETED" as ScanStatus,
            stage: "COMPLETED" as ScanStage,
            progress: 100,
            completedAt: new Date(),
            // Placeholder analysis until Phase 5
            aiAnalysis: {
              summary: "Simulated analysis — real AI analysis arrives in Phase 5.",
              simulated: true,
              visibilityScore: Math.floor(Math.random() * 40) + 40,
              issuesFound: Math.floor(Math.random() * 12) + 3,
            },
          },
        });

        // Update client
        const scan = await prisma.scan.findUnique({
          where: { id: scanId },
          select: { clientId: true, aiAnalysis: true },
        });

        if (scan) {
          const analysis = scan.aiAnalysis as {
            visibilityScore?: number;
          } | null;

          await prisma.client.update({
            where: { id: scan.clientId },
            data: {
              status: "ACTIVE" as ClientStatus,
              lastScannedAt: new Date(),
              currentVisibilityScore: analysis?.visibilityScore ?? null,
            },
          });
        }
      } else {
        await prisma.scan.update({
          where: { id: scanId },
          data: {
            stage: step.stage,
            progress: step.progress,
          },
        });
      }
    }
  } catch (err) {
    console.error(`[scan-worker] Scan ${scanId} failed:`, err);
    await prisma.scan
      .update({
        where: { id: scanId },
        data: {
          status: "FAILED",
          stage: "FAILED",
          errorMessage:
            err instanceof Error ? err.message : "Unknown scan error",
          completedAt: new Date(),
        },
      })
      .catch(() => {});

    // Reset client status
    const scan = await prisma.scan
      .findUnique({ where: { id: scanId }, select: { clientId: true } })
      .catch(() => null);

    if (scan) {
      await prisma.client
        .update({
          where: { id: scan.clientId },
          data: { status: "ERROR" },
        })
        .catch(() => {});
    }
  }
}

/** Fire-and-forget — does not block the API response */
export function enqueueSimulatedScan(scanId: string) {
  // In production Phase 5+: replace with Inngest / BullMQ
  setImmediate(() => {
    runSimulatedScan(scanId).catch((err) => {
      console.error(`[scan-worker] Unhandled error for ${scanId}:`, err);
    });
  });
}
