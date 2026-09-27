import { prisma } from "./prisma";

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
    where: {
      agencyId_periodStart: { agencyId, periodStart: start },
    },
  });

  if (!meter) {
    meter = await prisma.usageMeter.create({
      data: {
        agencyId,
        periodStart: start,
        periodEnd: end,
      },
    });
  }

  return meter;
}

export async function getUsageSummary(agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: { plan: true },
  });

  const meter = await getOrCreateUsageMeter(agencyId);

  const clientsCount = await prisma.client.count({
    where: { agencyId, deletedAt: null },
  });

  const periodStart = meter.periodStart;
  const scansUsed = await prisma.scan.count({
    where: {
      agencyId,
      createdAt: { gte: periodStart },
      status: { not: "FAILED" },
    },
  });

  const promptsUsed = await prisma.trackedPrompt.count({
    where: { agencyId, deletedAt: null },
  });

  const teamSeats = await prisma.user.count({
    where: { agencyId, deletedAt: null },
  });

  // Sync meter counts
  await prisma.usageMeter.update({
    where: { id: meter.id },
    data: {
      clientsCount,
      scansUsed,
      promptsUsed,
    },
  });

  const plan = agency?.plan;

  return {
    plan: plan
      ? {
          name: plan.name,
          slug: plan.slug,
          maxClients: plan.maxClients,
          maxScansPerMonth: plan.maxScansPerMonth,
          maxTrackedPrompts: plan.maxTrackedPrompts,
          maxTeamSeats: plan.maxTeamSeats,
          whiteLabel: plan.whiteLabel,
        }
      : null,
    usage: {
      clientsCount,
      scansUsed,
      promptsUsed,
      teamSeats,
      reportsGenerated: meter.reportsGenerated,
    },
    limits: plan
      ? {
          clientsNearLimit: clientsCount >= plan.maxClients * 0.8,
          scansNearLimit: scansUsed >= plan.maxScansPerMonth * 0.8,
          promptsNearLimit: promptsUsed >= plan.maxTrackedPrompts * 0.8,
          seatsNearLimit: teamSeats >= plan.maxTeamSeats * 0.8,
          clientsAtLimit: clientsCount >= plan.maxClients,
          scansAtLimit: scansUsed >= plan.maxScansPerMonth,
          promptsAtLimit: promptsUsed >= plan.maxTrackedPrompts,
          seatsAtLimit: teamSeats >= plan.maxTeamSeats,
        }
      : null,
    periodStart: meter.periodStart,
    periodEnd: meter.periodEnd,
  };
}
