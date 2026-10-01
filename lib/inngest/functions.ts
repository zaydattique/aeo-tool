import { inngest } from "./client";
import { runScan } from "@/lib/scan-worker";
import { runVisibilityJob } from "@/lib/visibility-job";
import {
  visibilityGlobalConcurrency,
  visibilityAgencyConcurrency,
} from "@/lib/visibility-config";
import { prisma } from "@/lib/prisma";
import {
  sendEmail,
  scanCompletedEmailHtml,
  weeklyDigestEmailHtml,
} from "@/lib/email";

const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

/** Durable scan job — retries on failure */
export const runScanJob = inngest.createFunction(
  {
    id: "scan-run",
    retries: 2,
    concurrency: [{ limit: 3 }],
  },
  { event: "scan/run" },
  async ({ event, step }) => {
    const scanId = event.data.scanId as string;
    await step.run("execute-scan", async () => {
      await runScan(scanId);
    });

    await step.run("notify-owners", async () => {
      const scan = await prisma.scan.findUnique({
        where: { id: scanId },
        include: {
          client: { select: { id: true, name: true, currentVisibilityScore: true } },
          agency: {
            select: {
              id: true,
              name: true,
              users: {
                where: {
                  role: { in: ["AGENCY_OWNER", "AGENCY_MEMBER"] },
                  deletedAt: null,
                },
                select: { email: true, role: true },
              },
            },
          },
        },
      });

      if (!scan || scan.status !== "COMPLETED") return;

      const actionsCount = await prisma.action.count({
        where: {
          scanId,
          deletedAt: null,
        },
      });

      const owners = scan.agency.users.filter((u) => u.role === "AGENCY_OWNER");
      const recipients = (owners.length ? owners : scan.agency.users).map(
        (u) => u.email
      );

      if (recipients.length === 0) return;

      const html = scanCompletedEmailHtml({
        agencyName: scan.agency.name,
        clientName: scan.client.name,
        score: scan.client.currentVisibilityScore,
        actionsCount,
        dashboardUrl: `${appUrl()}/dashboard/clients/${scan.client.id}`,
      });

      await sendEmail({
        to: recipients,
        subject: `Scan complete: ${scan.client.name}`,
        html,
      });
    });

    return { scanId, ok: true };
  }
);

/**
 * Durable visibility snapshot — global + per-agency concurrency.
 * Retries are idempotent via snapshot unique(jobId, promptId) + terminal job status.
 */
export const runVisibilitySnapshotJob = inngest.createFunction(
  {
    id: "visibility-snapshot",
    retries: 2,
    concurrency: [
      { limit: visibilityGlobalConcurrency() },
      {
        key: "event.data.agencyId",
        limit: visibilityAgencyConcurrency(),
      },
    ],
  },
  { event: "visibility/snapshot" },
  async ({ event, step }) => {
    const jobId = event.data.jobId as string;
    await step.run("execute-visibility", async () => {
      await runVisibilityJob(jobId);
    });
    return { jobId, ok: true };
  }
);

/** Hourly: enqueue due weekly re-scans */
export const weeklyRescanCron = inngest.createFunction(
  { id: "weekly-rescan-cron", retries: 1 },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const due = await step.run("find-due-clients", async () => {
      const now = new Date();
      return prisma.client.findMany({
        where: {
          deletedAt: null,
          rescanEnabled: true,
          nextRescanAt: { lte: now },
          agency: {
            deletedAt: null,
            status: { in: ["ACTIVE", "TRIAL"] },
          },
        },
        select: {
          id: true,
          agencyId: true,
          websiteUrl: true,
          rescanIntervalDays: true,
          agency: { select: { plan: true } },
        },
        take: 50,
      });
    });

    let enqueued = 0;

    for (const client of due) {
      await step.run(`rescan-${client.id}`, async () => {
        const active = await prisma.scan.findFirst({
          where: {
            clientId: client.id,
            status: { in: ["QUEUED", "RUNNING"] },
          },
        });
        if (active) return;

        if (client.agency.plan) {
          const periodStart = new Date();
          periodStart.setDate(1);
          periodStart.setHours(0, 0, 0, 0);
          const used = await prisma.scan.count({
            where: {
              agencyId: client.agencyId,
              createdAt: { gte: periodStart },
              status: { not: "FAILED" },
            },
          });
          if (used >= client.agency.plan.maxScansPerMonth) {
            await prisma.client.update({
              where: { id: client.id },
              data: {
                nextRescanAt: new Date(
                  Date.now() + client.rescanIntervalDays * 86400000
                ),
              },
            });
            return;
          }
        }

        const scan = await prisma.scan.create({
          data: {
            agencyId: client.agencyId,
            clientId: client.id,
            status: "QUEUED",
            stage: "QUEUED",
            progress: 0,
          },
        });

        await prisma.client.update({
          where: { id: client.id },
          data: {
            status: "SCANNING",
            nextRescanAt: new Date(
              Date.now() + client.rescanIntervalDays * 86400000
            ),
          },
        });

        await inngest.send({ name: "scan/run", data: { scanId: scan.id } });
        enqueued += 1;
      });
    }

    return { due: due.length, enqueued };
  }
);

/** Monday 09:00 UTC — simple agency digest */
export const weeklyDigestCron = inngest.createFunction(
  { id: "weekly-digest-cron", retries: 1 },
  { cron: "0 9 * * 1" },
  async ({ step }) => {
    const agencies = await step.run("list-agencies", async () =>
      prisma.agency.findMany({
        where: {
          deletedAt: null,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        select: {
          id: true,
          name: true,
          users: {
            where: { role: "AGENCY_OWNER", deletedAt: null },
            select: { email: true },
          },
        },
      })
    );

    for (const agency of agencies) {
      if (agency.users.length === 0) continue;

      await step.run(`digest-${agency.id}`, async () => {
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const [scans, openHigh, clients] = await Promise.all([
          prisma.scan.count({
            where: {
              agencyId: agency.id,
              status: "COMPLETED",
              completedAt: { gte: weekAgo },
            },
          }),
          prisma.action.count({
            where: {
              agencyId: agency.id,
              deletedAt: null,
              priority: "HIGH",
              status: { in: ["TODO", "IN_PROGRESS"] },
            },
          }),
          prisma.client.count({
            where: { agencyId: agency.id, deletedAt: null },
          }),
        ]);

        const html = weeklyDigestEmailHtml({
          agencyName: agency.name,
          lines: [
            `${clients} active clients`,
            `${scans} scans completed in the last 7 days`,
            `${openHigh} open HIGH priority actions`,
          ],
          dashboardUrl: `${appUrl()}/dashboard`,
        });

        await sendEmail({
          to: agency.users.map((u) => u.email),
          subject: `Weekly AEO digest — ${agency.name}`,
          html,
        });
      });
    }

    return { agencies: agencies.length };
  }
);

export const inngestFunctions = [
  runScanJob,
  runVisibilitySnapshotJob,
  weeklyRescanCron,
  weeklyDigestCron,
];
