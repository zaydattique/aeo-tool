import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { readJsonBody } from "@/lib/request-security";

const schema = z.object({
  agencyId: z.string().min(1),
  /** Set to true to stop impersonating */
  stop: z.boolean().optional(),
});

/**
 * Impersonation: returns target agency context for the client to call
 * session.update(). Logged + intended to be time-boxed on the client (1h).
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await readJsonBody<unknown>(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.stop) {
    await prisma.activityLog.create({
      data: {
        actorId: auth.session.user.id,
        action: "admin.impersonation_stopped",
        resourceType: "user",
        resourceId: auth.session.user.id,
      },
    });
    return NextResponse.json({
      stop: true,
      agencyId: null,
      agencyName: null,
      onboardingCompleted: true,
    });
  }

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const agency = await prisma.agency.findFirst({
    where: { id: parsed.data.agencyId, deletedAt: null, status: { in: ["ACTIVE", "TRIAL"] } },
    select: { id: true, name: true, status: true, onboardingCompleted: true },
  });

  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  await prisma.activityLog.create({
    data: {
      agencyId: agency.id,
      actorId: auth.session.user.id,
      action: "admin.impersonation_started",
      resourceType: "agency",
      resourceId: agency.id,
      metadata: {
        expiresAt: expiresAt.toISOString(),
      },
    },
  });

  return NextResponse.json({
    agencyId: agency.id,
    agencyName: agency.name,
    onboardingCompleted: agency.onboardingCompleted,
    expiresAt: expiresAt.toISOString(),
  });
}
