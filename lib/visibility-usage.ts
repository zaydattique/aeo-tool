/**
 * Atomic AI visibility usage reservation + job-owned settlement.
 *
 * Unit model (P0-A):
 * - 1 visibility op = 1 expected live provider call, OR 1 prompt when no live engines.
 * - Reserve before enqueue (agency meter).
 * - Settle once per job inside a DB transaction that flips VisibilityJob.usageSettled.
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

export type JobSettlementResult = {
  alreadySettled: boolean;
  appliedConsume: number;
  appliedRelease: number;
  finalOpsConsumed: number;
};

/**
 * Final job-owned settlement (consume + release remainder) in one transaction.
 *
 * - If job.usageSettled already true → no-op (retry-safe).
 * - appliedConsume = min(requestedConsume, opsReserved - opsConsumed)
 * - appliedRelease = opsReserved - finalOpsConsumed
 * - Meter: used += appliedConsume; reserved -= (appliedConsume + appliedRelease)
 *   which equals reserved -= opsReserved (the job's original reservation).
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

    const appliedConsume = cappedConsume(
      job.opsReserved,
      job.opsConsumed,
      requestedConsume
    );
    const finalOpsConsumed = job.opsConsumed + appliedConsume;
    const appliedRelease = Math.max(0, job.opsReserved - finalOpsConsumed);

    await tx.visibilityJob.update({
      where: { id: jobId },
      data: {
        opsConsumed: finalOpsConsumed,
        usageSettled: true,
      },
    });

    const meterDelta = appliedConsume + appliedRelease;
    if (meterDelta > 0 || appliedConsume > 0) {
      await tx.$executeRaw`
        UPDATE "UsageMeter"
        SET
          "visibilityOpsReserved" = GREATEST(0, "visibilityOpsReserved" - ${meterDelta}),
          "visibilityOpsUsed" = "visibilityOpsUsed" + ${appliedConsume},
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
        appliedConsume,
        appliedRelease,
        finalOpsConsumed,
        opsReserved: job.opsReserved,
      })
    );

    return {
      alreadySettled: false,
      appliedConsume,
      appliedRelease,
      finalOpsConsumed,
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
