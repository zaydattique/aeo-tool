/**
 * Atomic AI visibility usage reservation + job-owned settlement.
 *
 * Unit model (P0-A):
 * - 1 visibility op = 1 expected live provider call, OR 1 prompt when no live engines.
 * - Reserve before enqueue (agency meter).
 * - Settle once per job inside a DB transaction that flips VisibilityJob.usageSettled
 *   via a conditional UPDATE (WHERE usageSettled = false). Concurrent retries cannot
 *   both apply meter deltas.
 *
 * Retries never double-settle: usageSettled is the durable guard.
 */

import { prisma } from "./prisma";
import { visibilityOpsMonthlyLimit } from "./visibility-config";

function currentPeriod() {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export async function getOrCreateUsageMeter(agencyId: string) {
  const { start, end } = currentPeriod();
  let meter = await prisma.usageMeter.findUnique({
    where: { agencyId_periodStart: { agencyId, periodStart: start } },
  });
  if (!meter) {
    meter = await prisma.usageMeter.create({
      data: { agencyId, periodStart: start, periodEnd: end },
    });
  }
  return meter;
}

export type ReserveResult =
  | { ok: true; meterId: string; reserved: number; used: number; limit: number }
  | {
      ok: false;
      reason: "budget_exceeded";
      used: number;
      reserved: number;
      limit: number;
      needed: number;
    };

/**
 * Atomically reserve `ops` against monthly budget.
 * effective = visibilityOpsUsed + visibilityOpsReserved + ops <= limit
 */
export async function reserveVisibilityOps(
  agencyId: string,
  ops: number
): Promise<ReserveResult> {
  if (ops <= 0) {
    const meter = await getOrCreateUsageMeter(agencyId);
    return {
      ok: true,
      meterId: meter.id,
      reserved: meter.visibilityOpsReserved,
      used: meter.visibilityOpsUsed,
      limit: visibilityOpsMonthlyLimit(),
    };
  }

  const limit = visibilityOpsMonthlyLimit();
  await getOrCreateUsageMeter(agencyId);
  const { start } = currentPeriod();

  const updated = await prisma.$executeRaw`
    UPDATE "UsageMeter"
    SET
      "visibilityOpsReserved" = "visibilityOpsReserved" + ${ops},
      "updatedAt" = NOW()
    WHERE "agencyId" = ${agencyId}
      AND "periodStart" = ${start}
      AND ("visibilityOpsUsed" + "visibilityOpsReserved" + ${ops}) <= ${limit}
  `;

  const meter = await prisma.usageMeter.findUnique({
    where: { agencyId_periodStart: { agencyId, periodStart: start } },
  });

  if (!meter) {
    return {
      ok: false,
      reason: "budget_exceeded",
      used: 0,
      reserved: 0,
      limit,
      needed: ops,
    };
  }

  if (Number(updated) === 0) {
    return {
      ok: false,
      reason: "budget_exceeded",
      used: meter.visibilityOpsUsed,
      reserved: meter.visibilityOpsReserved,
      limit,
      needed: ops,
    };
  }

  console.info(
    JSON.stringify({
      event: "usage_reserved",
      agencyId,
      ops,
      used: meter.visibilityOpsUsed,
      reserved: meter.visibilityOpsReserved,
      limit,
    })
  );

  return {
    ok: true,
    meterId: meter.id,
    reserved: meter.visibilityOpsReserved,
    used: meter.visibilityOpsUsed,
    limit,
  };
}

/**
 * Pure helper: how many ops can still be consumed against a job reservation.
 * Exported for unit tests.
 */
export function cappedConsume(
  opsReserved: number,
  opsConsumed: number,
  requested: number
): number {
  if (requested <= 0) return 0;
  const room = Math.max(0, opsReserved - opsConsumed);
  return Math.min(requested, room);
}

/**
 * Pure settlement math for a single job (no DB).
 * Models Cases A–E from the P0-A review without touching another job's reservation.
 */
export function computeJobSettlement(opts: {
  opsReserved: number;
  opsConsumed: number;
  usageSettled: boolean;
  requestedConsume: number;
}): {
  alreadySettled: boolean;
  appliedConsume: number;
  appliedRelease: number;
  finalOpsConsumed: number;
  meterUsedDelta: number;
  meterReservedDelta: number;
} {
  if (opts.usageSettled) {
    return {
      alreadySettled: true,
      appliedConsume: 0,
      appliedRelease: 0,
      finalOpsConsumed: opts.opsConsumed,
      meterUsedDelta: 0,
      meterReservedDelta: 0,
    };
  }

  const appliedConsume = cappedConsume(
    opts.opsReserved,
    opts.opsConsumed,
    opts.requestedConsume
  );
  const finalOpsConsumed = opts.opsConsumed + appliedConsume;
  const appliedRelease = Math.max(0, opts.opsReserved - finalOpsConsumed);

  // Meter: used += consume; reserved -= (consume + release) == reserved -= opsReserved
  return {
    alreadySettled: false,
    appliedConsume,
    appliedRelease,
    finalOpsConsumed,
    meterUsedDelta: appliedConsume,
    meterReservedDelta: -(appliedConsume + appliedRelease),
  };
}

export type JobSettlementResult = {
  alreadySettled: boolean;
  appliedConsume: number;
  appliedRelease: number;
  finalOpsConsumed: number;
};

/**
 * Final job-owned settlement (consume + release remainder) in one transaction.
 *
 * Atomicity:
 * 1. Conditional UPDATE VisibilityJob SET usageSettled=true WHERE usageSettled=false
 *    → only one concurrent worker wins.
 * 2. Winner applies meter deltas for exactly this job's reservation.
 * 3. Loser (or later retry) returns alreadySettled with zero meter deltas.
 *
 * Never touches another job's reservation: only the delta for this job.
 */
export async function settleVisibilityJobUsage(opts: {
  jobId: string;
  agencyId: string;
  /** Ops successfully used this completion attempt (may exceed remaining room; will be capped). */
  requestedConsume: number;
}): Promise<JobSettlementResult> {
  const { jobId, agencyId, requestedConsume } = opts;
  const { start } = currentPeriod();

  return prisma.$transaction(async (tx) => {
    const job = await tx.visibilityJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error(`VisibilityJob ${jobId} not found for settlement`);
    }

    if (job.usageSettled) {
      console.info(
        JSON.stringify({
          event: "usage_settlement_skipped",
          jobId,
          agencyId,
          reason: "already_settled",
          opsConsumed: job.opsConsumed,
        })
      );
      return {
        alreadySettled: true,
        appliedConsume: 0,
        appliedRelease: 0,
        finalOpsConsumed: job.opsConsumed,
      };
    }

    const plan = computeJobSettlement({
      opsReserved: job.opsReserved,
      opsConsumed: job.opsConsumed,
      usageSettled: false,
      requestedConsume,
    });

    // Conditional claim — concurrent retry loses and must not touch the meter
    const claimed = await tx.$executeRaw`
      UPDATE "VisibilityJob"
      SET
        "opsConsumed" = ${plan.finalOpsConsumed},
        "usageSettled" = true,
        "updatedAt" = NOW()
      WHERE "id" = ${jobId}
        AND "usageSettled" = false
    `;

    if (Number(claimed) === 0) {
      const again = await tx.visibilityJob.findUnique({ where: { id: jobId } });
      console.info(
        JSON.stringify({
          event: "usage_settlement_skipped",
          jobId,
          agencyId,
          reason: "lost_race_or_already_settled",
          opsConsumed: again?.opsConsumed ?? job.opsConsumed,
        })
      );
      return {
        alreadySettled: true,
        appliedConsume: 0,
        appliedRelease: 0,
        finalOpsConsumed: again?.opsConsumed ?? job.opsConsumed,
      };
    }

    const meterDelta = plan.appliedConsume + plan.appliedRelease;
    if (meterDelta > 0 || plan.appliedConsume > 0) {
      await tx.$executeRaw`
        UPDATE "UsageMeter"
        SET
          "visibilityOpsReserved" = GREATEST(0, "visibilityOpsReserved" - ${meterDelta}),
          "visibilityOpsUsed" = "visibilityOpsUsed" + ${plan.appliedConsume},
          "updatedAt" = NOW()
        WHERE "agencyId" = ${agencyId}
          AND "periodStart" = ${start}
      `;
    }

    console.info(
      JSON.stringify({
        event: "usage_settled",
        jobId,
        agencyId,
        appliedConsume: plan.appliedConsume,
        appliedRelease: plan.appliedRelease,
        finalOpsConsumed: plan.finalOpsConsumed,
        opsReserved: job.opsReserved,
      })
    );

    return {
      alreadySettled: false,
      appliedConsume: plan.appliedConsume,
      appliedRelease: plan.appliedRelease,
      finalOpsConsumed: plan.finalOpsConsumed,
    };
  });
}

/**
 * Agency-level release only when no job row exists yet (e.g. budget reserved
 * then create failed before job insert). Existing jobs must use settleVisibilityJobUsage.
 */
export async function releaseVisibilityOpsAgencyOnly(
  agencyId: string,
  ops: number
): Promise<void> {
  if (ops <= 0) return;
  const { start } = currentPeriod();
  await prisma.$executeRaw`
    UPDATE "UsageMeter"
    SET
      "visibilityOpsReserved" = GREATEST(0, "visibilityOpsReserved" - ${ops}),
      "updatedAt" = NOW()
    WHERE "agencyId" = ${agencyId}
      AND "periodStart" = ${start}
  `;
  console.info(JSON.stringify({ event: "usage_released", agencyId, ops }));
}
