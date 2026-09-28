import { prisma } from "./prisma";
import { crawlWebsite } from "./crawl";
import { analyzeForAeo } from "./ai-analysis";
import { mapIssuesToActionDrafts } from "./action-mapper";
import type { ActionPriority, ActionCategory, ActionEffort } from "@prisma/client";

/**
 * Production scan pipeline.
 * Stages: QUEUED → CRAWL → EXTRACT → AI_ANALYSIS → ACTION_GENERATION → COMPLETED
 *
 * Actions: mapped via lib/action-mapper (priority sort, multi-step, dedupe).
 * Queue: currently in-process — see docs/QUEUE_AND_JOBS.md for migration.
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

const VALID_PRIORITIES = new Set(["HIGH", "MEDIUM", "LOW"]);
const VALID_CATEGORIES = new Set([
  "TECHNICAL",
  "CONTENT",
  "SCHEMA",
  "ENTITY",
  "AUTHORITY",
  "PERFORMANCE",
  "OTHER",
]);
const VALID_EFFORTS = new Set(["LOW", "MEDIUM", "HIGH"]);

function normalizePriority(v: string): ActionPriority {
  return (VALID_PRIORITIES.has(v) ? v : "MEDIUM") as ActionPriority;
}
function normalizeCategory(v: string): ActionCategory {
  return (VALID_CATEGORIES.has(v) ? v : "OTHER") as ActionCategory;
}
function normalizeEffort(v: string): ActionEffort {
  return (VALID_EFFORTS.has(v) ? v : "MEDIUM") as ActionEffort;
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

    await updateStage(scanId, "CRAWL", 15);
    const crawl = await crawlWebsite(scan.client.websiteUrl);

    await updateStage(scanId, "EXTRACT", 40, {
      rawCrawlData: {
        url: crawl.url,
        title: crawl.title,
        description: crawl.description,
        provider: crawl.provider,
        durationMs: crawl.durationMs,
        signals: crawl.signals,
        markdownPreview: crawl.markdown?.slice(0, 15000) ?? null,
        linkCount: crawl.links.length,
        metadata: crawl.metadata,
      },
    });

    await updateStage(scanId, "AI_ANALYSIS", 55);
    const analysis = await analyzeForAeo(
      crawl,
      scan.client.brandName || scan.client.name
    );

    await updateStage(scanId, "ACTION_GENERATION", 85);

    const actionDrafts = mapIssuesToActionDrafts(analysis.issues);

    await prisma.action.updateMany({
      where: {
        clientId: scan.client.id,
        agencyId: scan.agencyId,
        status: { in: ["TODO", "IN_PROGRESS"] },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    if (actionDrafts.length > 0) {
      await prisma.action.createMany({
        data: actionDrafts.map((d) => ({
          agencyId: scan.agencyId,
          clientId: scan.client.id,
          scanId: scan.id,
          priority: normalizePriority(d.priority),
          category: normalizeCategory(d.category),
          title: d.title.slice(0, 500),
          whyItMatters: d.whyItMatters.slice(0, 2000),
          steps: d.steps,
          effortLevel: normalizeEffort(d.effortLevel),
          suggestedText: d.suggestedText?.slice(0, 2000) || null,
          status: "TODO" as const,
        })),
      });
    }

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
          actionsCreated: actionDrafts.length,
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
      `[scan-worker] Scan ${scanId} completed — score ${analysis.visibilityScore}, actions=${actionDrafts.length}, provider=${analysis.provider}`
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

export function enqueueScan(scanId: string) {
  setImmediate(() => {
    runScan(scanId).catch((err) => {
      console.error(`[scan-worker] Unhandled error for ${scanId}:`, err);
    });
  });
}

export const enqueueSimulatedScan = enqueueScan;
export const runSimulatedScan = runScan;
