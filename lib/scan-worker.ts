import { prisma } from "./prisma";
import { deepCrawlWebsite } from "./deep-crawler";
import { analyzeForAeo } from "./ai-analysis";
import { mapIssuesToActionDrafts } from "./action-mapper";
import { validateWebsiteUrl } from "./url";
import { consumeProviderBudget } from "./provider-budget";
import type { ActionPriority, ActionCategory, ActionEffort } from "@prisma/client";

/**
 * Scan pipeline: CRAWL → EXTRACT → AI_ANALYSIS → ACTION_GENERATION → COMPLETED
 * Enqueue through the durable Inngest queue. Production never bypasses the queue.
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
  // Atomic claim prevents duplicate Inngest events and fallback invocations
  // from executing the expensive pipeline concurrently.
  const claim = await prisma.scan.updateMany({
    where: { id: scanId, status: "QUEUED" },
    data: {
      status: "RUNNING",
      stage: "CRAWL",
      progress: 5,
      startedAt: new Date(),
      errorMessage: null,
    },
  });

  if (claim.count !== 1) {
    const existing = await prisma.scan.findUnique({
      where: { id: scanId },
      select: { status: true },
    });
    console.log("[scan-worker] Scan " + scanId + " duplicate/no-op; status=" + (existing?.status ?? "MISSING"));
    return;
  }

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
      console.error(`[scan-worker] Scan ${scanId} missing after claim`);
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "FAILED",
          stage: "FAILED",
          errorMessage: "Scan or client record disappeared after worker claim",
          completedAt: new Date(),
        },
      }).catch(() => {});
      return;
    }

    // Re-validate at scan time — DNS / policy can change after client create
    const urlCheck = validateWebsiteUrl(scan.client.websiteUrl);
    if (!urlCheck.ok) {
      throw new Error(`Unsafe website URL: ${urlCheck.error}`);
    }

    await updateStage(scanId, "CRAWL", 15);

    const crawlBudget = await consumeProviderBudget("crawl", scan.agencyId);
    if (!crawlBudget.ok) {
      throw new Error(
        `Crawl provider budget exhausted; retry after ${crawlBudget.retryAfterSec}s`
      );
    }

    const deep = await deepCrawlWebsite(urlCheck.url);
    const first = deep.pages[0];
    const crawl = {
      url: deep.startUrl, title: first?.title ?? null, description: first?.metaDescription ?? null,
      markdown: null, html: null, links: deep.pages.flatMap((p) => p.links).slice(0, 2000),
      metadata: { methodologyVersion: "5.0", pagesCrawled: deep.pages.length, pagesFailed: deep.pages.filter((p) => p.statusCode === 0).length, sitemapFound: deep.sitemap.found, sitemapUrlCount: deep.sitemap.urls.length, robotsFetched: deep.robots.fetched, robotsAllowed: deep.robots.allowed, llmsTxtFound: deep.llmsTxt.found, truncated: deep.truncated },
      signals: {
        hasTitle: Boolean(first?.title), titleLength: first?.title?.length ?? 0, hasMetaDescription: Boolean(first?.metaDescription),
        metaDescriptionLength: first?.metaDescription?.length ?? 0, h1Count: first?.h1Count ?? 0, h2Count: first?.h2Count ?? 0, h3Count: 0,
        wordCount: first?.wordCount ?? 0, hasCanonical: Boolean(first?.canonicalUrl), hasOpenGraph: false, hasTwitterCard: false,
        hasJsonLd: Boolean((first?.structuredData as { validBlocks?: number } | undefined)?.validBlocks),
        jsonLdTypes: (first?.structuredData as { types?: string[] } | undefined)?.types ?? [],
        hasFaqSchema: ((first?.structuredData as { types?: string[] } | undefined)?.types ?? []).includes("FAQPage"),
        hasOrgSchema: ((first?.structuredData as { types?: string[] } | undefined)?.types ?? []).some((x) => x === "Organization" || x === "LocalBusiness"),
        hasArticleSchema: ((first?.structuredData as { types?: string[] } | undefined)?.types ?? []).some((x) => x === "Article" || x === "BlogPosting"),
        hasLlmsTxtLink: false, imageCount: 0, imagesWithAlt: 0, internalLinkCount: first?.internalLinks ?? 0, externalLinkCount: first?.externalLinks ?? 0,
        hasViewport: true, hasLang: true, contentPreview: "",
      },
      provider: "basic" as const, durationMs: deep.durationMs,
    };

    const crawlRun = await prisma.crawlRun.create({ data: {
      agencyId: scan.agencyId, clientId: scan.client.id, scanId: scan.id, startUrl: deep.startUrl, status: "COMPLETED",
      pagesCrawled: deep.pages.length, pagesFailed: deep.pages.filter((p) => p.statusCode === 0).length,
      linksDiscovered: deep.pages.reduce((n, p) => n + p.links.length, 0),
      maxPages: Number(process.env.CRAWL_MAX_PAGES || 100), maxDepth: Number(process.env.CRAWL_MAX_DEPTH || 3),
      durationMs: deep.durationMs, robotsAllowed: deep.robots.allowed, sitemapFound: deep.sitemap.found,
      llmsTxtFound: deep.llmsTxt.found, completedAt: new Date(),
    }});
    if (deep.pages.length) {
      await prisma.crawlPage.createMany({ data: deep.pages.map((p) => ({
        runId: crawlRun.id, agencyId: scan.agencyId, clientId: scan.client.id, url: p.url, canonicalUrl: p.canonicalUrl, finalUrl: p.finalUrl,
        depth: p.depth, statusCode: p.statusCode, responseMs: p.responseMs, responseBytes: p.responseBytes, contentType: p.contentType,
        title: p.title, metaDescription: p.metaDescription, h1Count: p.h1Count, h2Count: p.h2Count, wordCount: p.wordCount,
        internalLinks: p.internalLinks, externalLinks: p.externalLinks, indexable: p.indexable, robotsNoindex: p.robotsNoindex,
        pageType: p.pageType, duplicateHash: p.duplicateHash, structuredData: p.structuredData, entitySignals: p.entitySignals,
        contentSignals: p.contentSignals, technicalSignals: p.technicalSignals,
      }))});
      const stored = await prisma.crawlPage.findMany({ where: { runId: crawlRun.id }, select: { id: true, url: true } });
      const idByUrl = new Map(stored.map((p) => [p.url, p.id]));
      const issues = deep.pages.flatMap((p) => p.issues.map((i) => ({
        runId: crawlRun.id, pageId: idByUrl.get(p.url), agencyId: scan.agencyId, clientId: scan.client.id,
        code: i.code, severity: i.severity, title: i.title, evidence: i.evidence,
      })));
      if (issues.length) await prisma.crawlIssue.createMany({ data: issues });
    }

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

    if (process.env.ANTHROPIC_API_KEY) {
      const aiBudget = await consumeProviderBudget("ai", scan.agencyId);
      if (!aiBudget.ok) {
        throw new Error(
          `AI provider budget exhausted; retry after ${aiBudget.retryAfterSec}s`
        );
      }
    }

    const analysis = await analyzeForAeo(
      crawl,
      scan.client.brandName || scan.client.name
    );

    await updateStage(scanId, "ACTION_GENERATION", 85);

    const actionDrafts = mapIssuesToActionDrafts(analysis.issues, {
      brandName: scan.client.brandName || scan.client.name,
      websiteUrl: scan.client.websiteUrl,
      title: crawl.title,
    });

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
          suggestedText: d.suggestedText?.slice(0, 8000) || null,
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

export async function enqueueScan(scanId: string) {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      select: { agencyId: true, status: true },
    });
    if (!scan) throw new Error(`Scan ${scanId} not found for enqueue`);
    if (scan.status !== "QUEUED") return;

    const { isInngestConfigured, inngest } = await import("@/lib/inngest/client");
    if (!isInngestConfigured()) {
      throw new Error("Durable scan queue is not configured");
    }

    await inngest.send({
      name: "scan/run",
      data: { scanId, agencyId: scan.agencyId },
    });
    console.log(`[scan-worker] Enqueued scan ${scanId} via Inngest`);
  } catch (err) {
    console.error(
      "[scan-worker] Durable enqueue failed:",
      err instanceof Error ? err.message : err
    );
    await prisma.scan.update({
      where: { id: scanId, status: "QUEUED" },
      data: {
        status: "FAILED",
        stage: "FAILED",
        errorMessage: "Durable scan queue unavailable",
        completedAt: new Date(),
      },
    }).catch(() => {});
  }
}

export const enqueueSimulatedScan = (scanId: string) => {
  void enqueueScan(scanId);
};
export const runSimulatedScan = runScan;
