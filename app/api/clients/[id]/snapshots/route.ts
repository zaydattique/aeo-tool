import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { createAndEnqueueVisibilityJob } from "@/lib/visibility-job";
import {
  visibilitySnapshotRateLimit,
  visibilitySnapshotRateWindowMs,
} from "@/lib/visibility-config";

/**
 * POST — enqueue durable visibility snapshot job (no synchronous AI work).
 * Returns 202 with job metadata. Poll job status or GET snapshots when complete.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!canManageClients(auth.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await rateLimit(
    `visibility:${auth.agencyId}`,
    visibilitySnapshotRateLimit(),
    visibilitySnapshotRateWindowMs()
  );
  if (!rl.ok) {
    console.info(
      JSON.stringify({
        event: "visibility_snapshot_rate_limited",
        agencyId: auth.agencyId,
        retryAfterSec: rl.retryAfterSec,
      })
    );
    return NextResponse.json(
      {
        error: "Too many visibility snapshots. Wait a few minutes.",
        code: "RATE_LIMITED",
        retryAfterSec: rl.retryAfterSec,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  const { id: clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId: auth.agencyId, deletedAt: null },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const idempotencyKey =
    req.headers.get("idempotency-key") ||
    req.headers.get("x-idempotency-key") ||
    null;

  const result = await createAndEnqueueVisibilityJob({
    agencyId: auth.agencyId,
    clientId,
    actorId: auth.session.user.id,
    idempotencyKey,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        code: result.code,
        jobId: result.jobId,
        usage: result.usage,
      },
      { status: result.status }
    );
  }

  return NextResponse.json(
    {
      job: result.job,
      jobId: result.job.id,
      status: result.job.status,
      deduplicated: result.job.deduplicated ?? false,
      message: result.job.deduplicated
        ? "Existing visibility job in progress or matched by idempotency key"
        : "Visibility snapshot job queued",
    },
    { status: result.job.deduplicated ? 200 : 202 }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const { id: clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId, deletedAt: null },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const [snapshots, activeJob] = await Promise.all([
    prisma.visibilitySnapshot.findMany({
      where: { clientId, agencyId },
      orderBy: { recordedAt: "asc" },
      include: {
        prompt: {
          select: { id: true, promptText: true, kind: true, targetName: true },
        },
      },
    }),
    prisma.visibilityJob.findFirst({
      where: {
        clientId,
        agencyId,
        status: { in: ["QUEUED", "RUNNING"] },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      ...s,
      score: Number(s.score),
    })),
    activeJob: activeJob
      ? {
          id: activeJob.id,
          status: activeJob.status,
          progress: activeJob.progress,
          promptCount: activeJob.promptCount,
          successCount: activeJob.successCount,
          failureCount: activeJob.failureCount,
        }
      : null,
  });
}
