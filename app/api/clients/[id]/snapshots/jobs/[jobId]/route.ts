import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";

/** Poll a visibility job belonging to this agency+client. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!canManageClients(auth.session!.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: clientId, jobId } = await params;

  const job = await prisma.visibilityJob.findFirst({
    where: {
      id: jobId,
      clientId,
      agencyId: auth.agencyId,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    job: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      promptCount: job.promptCount,
      opsReserved: job.opsReserved,
      opsConsumed: job.opsConsumed,
      liveEngineCount: job.liveEngineCount,
      successCount: job.successCount,
      failureCount: job.failureCount,
      errorMessage: job.errorMessage,
      resultSummary: job.resultSummary,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    },
  });
}
