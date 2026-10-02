/**
 * Durable visibility snapshot jobs.
 * HTTP only creates/queues; expensive provider work runs here via Inngest.
 */

import { prisma } from "./prisma";
import {
  checkPromptVisibility,
  getLiveEngineCapabilities,
} from "./visibility-check";
import {
  releaseVisibilityOpsAgencyOnly,
  reserveVisibilityOps,
  settleVisibilityJobUsage,
} from "./visibility-usage";
import { visibilityPromptConcurrency } from "./visibility-config";
import { isInngestConfigured } from "./inngest/client";
import type { VisibilityJobStatus } from "@prisma/client";

export function countExpectedOps(promptCount: number): number {
  const live = getLiveEngineCapabilities().filter((e) => e.configured).length;
  if (live === 0) return Math.max(1, promptCount);
  return promptCount * live;
}

/** Only fresh provider calls consume usage; cached live observations cost zero new calls. */
export function countFreshVisibilityOps(
  liveEngineCount: number,
  freshLiveEngineCount: number
): number {
  if (liveEngineCount === 0) return 1;
  return Math.max(0, Math.min(liveEngineCount, freshLiveEngineCount));
}

/** Pure check: same agency+key must map to same client. */
export function idempotencyKeyMatchesClient(
  existingClientId: string,
  requestedClientId: string
): boolean {
  return existingClientId === requestedClientId;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length || 1));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

export type EnqueueVisibilityResult =
  | {
      ok: true;
      job: {
        id: string;
        status: VisibilityJobStatus;
        promptCount: number;
        opsReserved: number;
        deduplicated?: boolean;
      };
    }
  | {
      ok: false;
      status: number;
      error: string;
      code?: string;
      jobId?: string;
      retryAfterSec?: number;
      usage?: { used: number; reserved: number; limit: number; needed: number };
    };

/**
 * Create VisibilityJob + reserve usage + enqueue Inngest.
 * Race-safe active job via activeClientKey unique constraint.
 * Idempotency key is agency-scoped but must match the same clientId.
 */
export async function createAndEnqueueVisibilityJob(opts: {
  agencyId: string;
  clientId: string;
  actorId?: string;
  idempotencyKey?: string | null;
}): Promise<EnqueueVisibilityResult> {
  const { agencyId, clientId, actorId, idempotencyKey } = opts;

  console.info(
    JSON.stringify({
      event: "visibility_snapshot_requested",
      agencyId,
      clientId,
      idempotencyKey: idempotencyKey || null,
    })
  );

  if (idempotencyKey) {
    const existing = await prisma.visibilityJob.findUnique({
      where: {
        agencyId_idempotencyKey: { agencyId, idempotencyKey },
      },
    });
    if (existing) {
      if (!idempotencyKeyMatchesClient(existing.clientId, clientId)) {
        console.info(
          JSON.stringify({
            event: "visibility_snapshot_idempotency_conflict",
            agencyId,
            clientId,
            existingClientId: existing.clientId,
            jobId: existing.id,
          })
        );
        return {
          ok: false,
          status: 409,
          error:
            "Idempotency-Key was already used for a different client in this agency",
          code: "IDEMPOTENCY_KEY_REUSED",
          jobId: existing.id,
        };
      }
      console.info(
        JSON.stringify({
          event: "visibility_snapshot_deduplicated",
          agencyId,
          clientId,
          jobId: existing.id,
          reason: "idempotency_key",
        })
      );
      return {
        ok: true,
        job: {
          id: existing.id,
          status: existing.status,
          promptCount: existing.promptCount,
          opsReserved: existing.opsReserved,
          deduplicated: true,
        },
      };
    }
  }

  // Optimization only — authoritative race safety is activeClientKey unique
  const active = await prisma.visibilityJob.findFirst({
    where: {
      clientId,
      agencyId,
      status: { in: ["QUEUED", "RUNNING"] },
    },
  });
  if (active) {
    console.info(
      JSON.stringify({
        event: "visibility_snapshot_deduplicated",
        agencyId,
        clientId,
        jobId: active.id,
        reason: "active_job",
      })
    );
    return {
      ok: true,
      job: {
        id: active.id,
        status: active.status,
        promptCount: active.promptCount,
        opsReserved: active.opsReserved,
        deduplicated: true,
      },
    };
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId, deletedAt: null },
  });
  if (!client) {
    return { ok: false, status: 404, error: "Client not found" };
  }

  let prompts = await prisma.trackedPrompt.findMany({
    where: { clientId, agencyId, deletedAt: null },
  });

  if (prompts.length === 0) {
    const { getDefaultPromptSeeds } = await import("./default-prompts");
    const defaults = getDefaultPromptSeeds(
      client.brandName || client.name,
      client.location
    );
    await prisma.trackedPrompt.createMany({
      data: defaults.map((s) => ({
        agencyId,
        clientId,
        promptText: s.promptText,
        isCustom: false,
        kind: s.kind,
        targetName: s.targetName || null,
      })),
    });
    prompts = await prisma.trackedPrompt.findMany({
      where: { clientId, agencyId, deletedAt: null },
    });
  }

  const opsNeeded = countExpectedOps(prompts.length);
  const reserve = await reserveVisibilityOps(agencyId, opsNeeded);
  if (!reserve.ok) {
    return {
      ok: false,
      status: 403,
      error: `Monthly visibility AI budget reached (${reserve.limit} ops). Try again next period or reduce prompts.`,
      code: "VISIBILITY_BUDGET_EXCEEDED",
      usage: {
        used: reserve.used,
        reserved: reserve.reserved,
        limit: reserve.limit,
        needed: reserve.needed,
      },
    };
  }

  if (!isInngestConfigured()) {
    await releaseVisibilityOpsAgencyOnly(agencyId, opsNeeded);
    return {
      ok: false,
      status: 503,
      error:
        "Visibility jobs require durable queue (Inngest). Configure INNGEST_EVENT_KEY or INNGEST_DEV=1.",
      code: "QUEUE_UNAVAILABLE",
    };
  }

  let job;
  try {
    job = await prisma.visibilityJob.create({
      data: {
        agencyId,
        clientId,
        status: "QUEUED",
        progress: 0,
        promptCount: prompts.length,
        opsReserved: opsNeeded,
        usageMeterId: reserve.meterId,
        liveEngineCount: getLiveEngineCapabilities().filter((e) => e.configured)
          .length,
        idempotencyKey: idempotencyKey || null,
        activeClientKey: clientId,
        actorId: actorId || null,
        usageSettled: false,
      },
    });
  } catch (err: unknown) {
    await releaseVisibilityOpsAgencyOnly(agencyId, opsNeeded);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      const again = await prisma.visibilityJob.findFirst({
        where: {
          clientId,
          agencyId,
          status: { in: ["QUEUED", "RUNNING"] },
        },
      });
      if (again) {
        console.info(
          JSON.stringify({
            event: "visibility_snapshot_deduplicated",
            agencyId,
            clientId,
            jobId: again.id,
            reason: "race_unique",
          })
        );
        return {
          ok: true,
          job: {
            id: again.id,
            status: again.status,
            promptCount: again.promptCount,
            opsReserved: again.opsReserved,
            deduplicated: true,
          },
        };
      }
      if (idempotencyKey) {
        const byKey = await prisma.visibilityJob.findUnique({
          where: {
            agencyId_idempotencyKey: { agencyId, idempotencyKey },
          },
        });
        if (byKey) {
          if (!idempotencyKeyMatchesClient(byKey.clientId, clientId)) {
            return {
              ok: false,
              status: 409,
              error:
                "Idempotency-Key was already used for a different client in this agency",
              code: "IDEMPOTENCY_KEY_REUSED",
              jobId: byKey.id,
            };
          }
          return {
            ok: true,
            job: {
              id: byKey.id,
              status: byKey.status,
              promptCount: byKey.promptCount,
              opsReserved: byKey.opsReserved,
              deduplicated: true,
            },
          };
        }
      }
    }
    console.error("[visibility-job] create failed", msg);
    return { ok: false, status: 500, error: "Failed to create visibility job" };
  }

  try {
    const { inngest } = await import("./inngest/client");
    await inngest.send({
      name: "visibility/snapshot",
      data: { jobId: job.id, agencyId, clientId },
    });
  } catch (err) {
    console.error("[visibility-job] enqueue failed", err);
    try {
      await settleVisibilityJobUsage({
        jobId: job.id,
        agencyId,
        requestedConsume: 0,
      });
      await prisma.visibilityJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          activeClientKey: null,
          errorMessage: "Failed to enqueue durable job",
          completedAt: new Date(),
        },
      });
    } catch (settleErr) {
      // Do not release through the agency-level meter after a job row exists:
      // the reservation belongs to this exact job/meter. Leave the durable
      // record for reconciliation rather than risking another job's budget.
      console.error(
        "[visibility-job] CRITICAL: settlement after enqueue failure failed; reservation requires reconciliation",
        settleErr
      );
      await prisma.visibilityJob
        .update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            activeClientKey: null,
            errorMessage:
              "Failed to enqueue durable job; usage settlement requires reconciliation",
            completedAt: new Date(),
          },
        })
        .catch(() => {});
    }
    return {
      ok: false,
      status: 503,
      error: "Failed to enqueue visibility job",
      code: "QUEUE_ENQUEUE_FAILED",
    };
  }

  if (actorId) {
    await prisma.activityLog.create({
      data: {
        agencyId,
        actorId,
        action: "visibility.snapshot_queued",
        resourceType: "visibility_job",
        resourceId: job.id,
        metadata: {
          clientId,
          promptCount: prompts.length,
          opsReserved: opsNeeded,
        },
      },
    });
  }

  console.info(
    JSON.stringify({
      event: "visibility_snapshot_queued",
      agencyId,
      clientId,
      jobId: job.id,
      promptCount: prompts.length,
      opsReserved: opsNeeded,
    })
  );

  return {
    ok: true,
    job: {
      id: job.id,
      status: job.status,
      promptCount: job.promptCount,
      opsReserved: job.opsReserved,
    },
  };
}

/**
 * Execute visibility job (Inngest worker). Idempotent on retry.
 * Usage is settled once via settleVisibilityJobUsage (usageSettled flag).
 */
export async function runVisibilityJob(jobId: string): Promise<void> {
  const job = await prisma.visibilityJob.findUnique({ where: { id: jobId } });
  if (!job) {
    console.error(`[visibility-job] Job ${jobId} not found`);
    return;
  }

  if (
    job.status === "COMPLETED" ||
    job.status === "PARTIAL" ||
    job.status === "FAILED"
  ) {
    if (!job.usageSettled) {
      await settleVisibilityJobUsage({
        jobId,
        agencyId: job.agencyId,
        requestedConsume: job.opsConsumed,
      }).catch((e) => console.error("[visibility-job] heal settlement", e));
    }
    console.info(
      JSON.stringify({
        event: "visibility_snapshot_skipped_terminal",
        jobId,
        status: job.status,
      })
    );
    return;
  }

  console.info(
    JSON.stringify({
      event: "visibility_snapshot_started",
      jobId,
      agencyId: job.agencyId,
      clientId: job.clientId,
    })
  );

  await prisma.visibilityJob.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      startedAt: job.startedAt ?? new Date(),
      progress: 5,
    },
  });

  const client = await prisma.client.findFirst({
    where: { id: job.clientId, agencyId: job.agencyId, deletedAt: null },
  });
  if (!client) {
    await failJob(jobId, job.agencyId, "Client not found");
    return;
  }

  const prompts = await prisma.trackedPrompt.findMany({
    where: {
      clientId: job.clientId,
      agencyId: job.agencyId,
      deletedAt: null,
    },
  });

  const base =
    client.currentVisibilityScore != null
      ? client.currentVisibilityScore
      : 50;
  const brand = client.brandName || client.name;

  let successCount = 0;
  let failureCount = 0;
  let opsEarnedThisRun = 0;
  let maxLive = 0;

  const existingForJob = await prisma.visibilitySnapshot.findMany({
    where: { jobId },
    select: { promptId: true, sources: true },
  });
  const donePromptIds = new Set(existingForJob.map((s) => s.promptId));

  for (const s of existingForJob) {
    const src = s.sources as {
      liveEngineCount?: number;
      freshLiveEngineCount?: number;
    } | null;
    const live = src?.liveEngineCount ?? 0;
    const fresh = src?.freshLiveEngineCount;
    opsEarnedThisRun += fresh != null ? fresh : live > 0 ? live : 1;
  }

  const concurrency = visibilityPromptConcurrency();
  let processed = donePromptIds.size;

  await mapPool(prompts, concurrency, async (prompt) => {
    if (donePromptIds.has(prompt.id)) {
      successCount += 1;
      return;
    }

    try {
      console.info(
        JSON.stringify({
          event: "provider_call_started",
          jobId,
          promptId: prompt.id,
        })
      );

      const check = await checkPromptVisibility({
        promptText: prompt.promptText,
        brandName: brand,
        baseScore: base,
        kind: prompt.kind || "brand",
        competitorName: prompt.targetName,
      });

      maxLive = Math.max(maxLive, check.liveEngineCount);

      // P0-A / FIX 4: engines already carry live:boolean; method is
      // live | live+heuristic | heuristic. Provider HTTP failures become
      // heuristic fills inside checkPromptVisibility — not claimed as live.
      // Full per-engine FAILED status is deferred to P1.
      // Only fresh provider calls consume AI ops. Shared-cache hits remain
      // live observations but cost zero new provider calls.
      const ops = countFreshVisibilityOps(
        check.liveEngineCount,
        check.freshLiveEngineCount
      );
      opsEarnedThisRun += ops;

      await prisma.visibilitySnapshot.upsert({
        where: {
          jobId_promptId: { jobId, promptId: prompt.id },
        },
        create: {
          agencyId: job.agencyId,
          clientId: job.clientId,
          promptId: prompt.id,
          jobId,
          score: check.score,
          sources: {
            method: check.method,
            engines: check.engines,
            liveEngineCount: check.liveEngineCount,
            freshLiveEngineCount: check.freshLiveEngineCount,
            baseScore: base,
            brandMentioned: check.brandMentioned,
            competitorMentioned: check.competitorMentioned,
            kind: prompt.kind,
            targetName: prompt.targetName,
            recordedAt: new Date().toISOString(),
          },
        },
        update: {
          score: check.score,
          sources: {
            method: check.method,
            engines: check.engines,
            liveEngineCount: check.liveEngineCount,
            freshLiveEngineCount: check.freshLiveEngineCount,
            baseScore: base,
            brandMentioned: check.brandMentioned,
            competitorMentioned: check.competitorMentioned,
            kind: prompt.kind,
            targetName: prompt.targetName,
            recordedAt: new Date().toISOString(),
          },
        },
      });

      successCount += 1;
      console.info(
        JSON.stringify({
          event: "provider_call_completed",
          jobId,
          promptId: prompt.id,
          liveEngineCount: check.liveEngineCount,
          freshLiveEngineCount: check.freshLiveEngineCount,
          method: check.method,
          cacheHits: check.engines.filter((e) => e.cacheHit).length,
        })
      );
    } catch (err) {
      failureCount += 1;
      console.error(
        JSON.stringify({
          event: "provider_call_failed",
          jobId,
          promptId: prompt.id,
          error: err instanceof Error ? err.message : "unknown",
        })
      );
    }

    processed += 1;
    const progress = Math.min(
      95,
      10 + Math.floor((processed / Math.max(1, prompts.length)) * 85)
    );
    await prisma.visibilityJob
      .update({
        where: { id: jobId },
        data: { progress, successCount, failureCount },
      })
      .catch(() => {});
  });

  const settlement = await settleVisibilityJobUsage({
    jobId,
    agencyId: job.agencyId,
    requestedConsume: opsEarnedThisRun,
  });

  let finalStatus: VisibilityJobStatus = "COMPLETED";
  if (successCount === 0 && failureCount > 0) finalStatus = "FAILED";
  else if (failureCount > 0) finalStatus = "PARTIAL";

  await prisma.visibilityJob.update({
    where: { id: jobId },
    data: {
      status: finalStatus,
      progress: 100,
      successCount,
      failureCount,
      opsConsumed: settlement.finalOpsConsumed,
      liveEngineCount: maxLive,
      activeClientKey: null,
      completedAt: new Date(),
      resultSummary: {
        successCount,
        failureCount,
        maxLiveEngines: maxLive,
        promptCount: prompts.length,
        usageAlreadySettled: settlement.alreadySettled,
        appliedConsume: settlement.appliedConsume,
        appliedRelease: settlement.appliedRelease,
      },
      errorMessage:
        finalStatus === "FAILED"
          ? "All prompt visibility checks failed"
          : finalStatus === "PARTIAL"
            ? `${failureCount} prompt(s) failed; ${successCount} succeeded`
            : null,
    },
  });

  console.info(
    JSON.stringify({
      event:
        finalStatus === "COMPLETED"
          ? "visibility_snapshot_completed"
          : finalStatus === "PARTIAL"
            ? "visibility_snapshot_partial"
            : "visibility_snapshot_failed",
      jobId,
      agencyId: job.agencyId,
      clientId: job.clientId,
      successCount,
      failureCount,
      opsConsumed: settlement.finalOpsConsumed,
      alreadySettled: settlement.alreadySettled,
    })
  );
}

async function failJob(jobId: string, agencyId: string, message: string) {
  const settlement = await settleVisibilityJobUsage({
    jobId,
    agencyId,
    requestedConsume: 0,
  });
  await prisma.visibilityJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      activeClientKey: null,
      errorMessage: message,
      completedAt: new Date(),
      progress: 100,
      opsConsumed: settlement.finalOpsConsumed,
    },
  });
  console.info(
    JSON.stringify({
      event: "visibility_snapshot_failed",
      jobId,
      agencyId,
      error: message,
      alreadySettled: settlement.alreadySettled,
    })
  );
}
