/**
 * Atomic AI visibility usage reservation against UsageMeter.
 *
 * Unit model (P0-A):
 * - 1 visibility op = 1 expected live provider call, OR 1 prompt when no live engines.
 * - Reserve before enqueue; convert reserved → used on consume; release remainder on failure.
 * - Retries must not double-reserve: job already holds opsReserved.
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

/** Move ops from reserved → used (successful provider work). */
export async function consumeVisibilityOps(
  agencyId: string,
  ops: number
): Promise<void> {
  if (ops <= 0) return;
  const { start } = currentPeriod();
  await prisma.$executeRaw`
    UPDATE "UsageMeter"
    SET
      "visibilityOpsReserved" = GREATEST(0, "visibilityOpsReserved" - ${ops}),
      "visibilityOpsUsed" = "visibilityOpsUsed" + ${ops},
      "updatedAt" = NOW()
    WHERE "agencyId" = ${agencyId}
      AND "periodStart" = ${start}
  `;
  console.info(JSON.stringify({ event: "usage_consumed", agencyId, ops }));
}

/** Release unused reservation (job failed / partial under-consumption). */
export async function releaseVisibilityOps(
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
