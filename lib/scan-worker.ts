import { prisma } from "./prisma";
import { crawlWebsite } from "./crawl";
import { analyzeForAeo } from "./ai-analysis";

/**
 * Production scan pipeline (Phase 5).
 * Stages: QUEUED → CRAWL → EXTRACT → AI_ANALYSIS → ACTION_GENERATION → COMPLETED
 *
 * Uses Firecrawl (or basic fetch) + Claude (or heuristic fallback).
 * Action generation stores issue list on aiAnalysis; full Action Center rows in Phase 6.
 */

async function updateStage(
  scanId: string,
  stage: string,
  progress: number,
  extra?: Record<string, unknown>
) {
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      stage: stage as "CRAWL",
      progress,
      ...extra,
    },
  });
}

export async function runScan(scanId: string) {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        client: {
          select: {
            id: true,
            websiteUrl: true,
            brandName: true,
            name: true,
          },
        },
      },
    });

    if (!scan || !scan.client) {
      console.error(`[scan-worker] Scan ${scanId} not found`);
      return;
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "RUNNING",
        stage: "CRAWL",
        progress: 5,
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    // ── CRAWL ──────────────────────────────────────
    await updateStage(scanId, "CRAWL", 15);
    const crawl = await crawlWebsite(scan.client.websiteUrl);

    // ── EXTRACT ────────────────────────────────────
    await updateStage(scanId, "EXTRACT", 40, {
      rawCrawlData: {
        url: crawl.url,
        title: crawl.title,
        description: crawl.description,
        provider: crawl.provider,
        durationMs: crawl.durationMs,
        signals: crawl.signals,
        // Store markdown preview, not full HTML (size)
        markdownPreview: crawl.markdown?.slice(0, 15000) ?? null,
        linkCount: crawl.links.length,
        metadata: crawl.metadata,
      },
    });

    // ── AI ANALYSIS ────────────────────────────────
    await updateStage(scanId, "AI_ANALYSIS", 55);
    const analysis = await analyzeForAeo(
      crawl,
      scan.client.brandName || scan.client.name
    );

    // ── ACTION GENERATION (prep for Phase 6) ───────
    await updateStage(scanId, "ACTION_GENERATION", 85);

    // Map issues into a structure Action Center will consume
    const actionDrafts = analysis.issues.map((issue, idx) => ({
      order: idx + 1,
      priority: issue.priority,
      category: issue.category,
      title: issue.title,
      whyItMatters: issue.whyItMatters,
      effortLevel: issue.effort,
      suggestedText: issue.suggestedFix,
      steps: [
        { order: 1, text: issue.suggestedFix },
      ],
    }));

    // ── COMPLETED ──────────────────────────────────
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "COMPLETED",
        stage: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
        aiAnalysis: {
          visibilityScore: analysis.visibilityScore,
          summary: analysis.summary,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          scores: analysis.scores,
          issues: analysis.issues,
          actionDrafts,
          provider: analysis.provider,
          model: analysis.model,
          inputTokens: analysis.inputTokens,
          outputTokens: analysis.outputTokens,
          analysisDurationMs: analysis.durationMs,
          crawlProvider: crawl.provider,
          crawlDurationMs: crawl.durationMs,
        },
      },
    });

    await prisma.client.update({
      where: { id: scan.client.id },
      data: {
        status: "ACTIVE",
        lastScannedAt: new Date(),
        currentVisibilityScore: analysis.visibilityScore,
      },
    });

    console.log(
      `[scan-worker] Scan ${scanId} completed — score ${analysis.visibilityScore}, provider=${analysis.provider}, issues=${analysis.issues.length}`
    );
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

    const failed = await prisma.scan
      .findUnique({ where: { id: scanId }, select: { clientId: true } })
      .catch(() => null);

    if (failed) {
      await prisma.client
        .update({
          where: { id: failed.clientId },
          data: { status: "ERROR" },
        })
        .catch(() => {});
    }
  }
}

/** Fire-and-forget — does not block the API response */
export function enqueueScan(scanId: string) {
  // Phase 5+: swap to Inngest / BullMQ for durable queues
  setImmediate(() => {
    runScan(scanId).catch((err) => {
      console.error(`[scan-worker] Unhandled error for ${scanId}:`, err);
    });
  });
}

// Back-compat aliases used by Phase 4 API
export const enqueueSimulatedScan = enqueueScan;
export const runSimulatedScan = runScan;
