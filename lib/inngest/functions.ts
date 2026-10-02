import { inngest } from "./client";
import { runScan } from "@/lib/scan-worker";
import { runVisibilityJob } from "@/lib/visibility-job";
import {
  visibilityGlobalConcurrency,
  visibilityAgencyConcurrency,
  scanAgencyExecutionConcurrency,
  scanGlobalExecutionConcurrency,
  scanAgencyBacklogLimit,
  scanGlobalBacklogLimit,
  scanAdmissionLockTimeoutMs,
} from "@/lib/visibility-config";
import { admitScan } from "@/lib/scan-admission";
import { recoverStaleScans } from "@/lib/scan-recovery";
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
    // runScan performs its own terminal failure transition. Keep the durable
    // function non-retrying so a provider failure cannot multiply provider
    // spend or race a second worker against the same scan.
    retries: 0,
    idempotency: "event.data.scanId",
    concurrency: [
      { scope: "env", key: '"scan-execution"', limit: scanGlobalExecutionConcurrency() },
      { key: "event.data.agencyId", limit: scanAgencyExecutionConcurrency() },
    ],
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

/** Every 5 minutes: reclaim scans abandoned by crashed workers. */
export const staleScanRecoveryCron = inngest.createFunction(
  {
    id: "stale-scan-recovery",
    retries: 1,
    concurrency: { scope: "env", key: '"stale-scan-recovery"', limit: 1 },
  },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    return step.run("recover-stale-scans", () => recoverStaleScans());
  }
);

/** Hourly: enqueue due weekly re-scans */
export const weeklyRescanCron = inngest.createFunction(
  {
    id: "weekly-rescan-cron",
    retries: 1,
    concurrency: { scope: "env", key: '"weekly-rescan-cron"', limit: 1 },
  },
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
        const admission = await prisma.$transaction((tx) =>
          admitScan(
            tx,
            {
              agencyId: client.agencyId,
              clientId: client.id,
              websiteUrl: client.websiteUrl,
              maxScansPerMonth: client.agency.plan?.maxScansPerMonth ?? null,
              rescanIntervalDays: client.rescanIntervalDays,
              updateNextRescanAt: true,
            },
            {
              globalBacklogLimit: scanGlobalBacklogLimit(),
              agencyBacklogLimit: scanAgencyBacklogLimit(),
              lockTimeoutMs: scanAdmissionLockTimeoutMs(),
            }
          )
        );

        if (!admission.scan) {
          if (admission.reason === "GLOBAL_BACKLOG" || admission.reason === "AGENCY_BACKLOG" || admission.reason === "ADMISSION_BUSY") {
            await prisma.client.update({
              where: { id: client.id },
              data: { nextRescanAt: new Date(Date.now() + 30 * 60 * 1000) },
            }).catch(() => {});
          }
          return;
        }

        const scan = admission.scan;

        try {
          await inngest.send({ name: "scan/run", data: { scanId: scan.id, agencyId: client.agencyId } });
          enqueued += 1;
        } catch (err) {
          await prisma.scan.update({
            where: { id: scan.id },
            data: {
              status: "FAILED",
              stage: "FAILED",
              errorMessage: "Unable to enqueue scheduled scan",
              completedAt: new Date(),
            },
          }).catch(() => {});
          await prisma.client.update({
            where: { id: client.id },
            data: { status: "ERROR" },
          }).catch(() => {});
          throw err;
        }
      });
    }
    return { due: due.length, enqueued };
  }
);

/** Monday 09:00 UTC — simple agency digest */
export const weeklyDigestCron = inngest.createFunction(
  {
    id: "weekly-digest-cron",
    retries: 1,
    concurrency: { scope: "env", key: '"weekly-digest-cron"', limit: 1 },
  },
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
  staleScanRecoveryCron,
  weeklyDigestCron,
];
