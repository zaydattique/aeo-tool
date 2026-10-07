import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { readJsonBody } from "@/lib/request-security";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIAL", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await readJsonBody<unknown>(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const agency = await prisma.agency.findFirst({
    where: { id, deletedAt: null },
  });
  if (!agency) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.agency.update({
    where: { id },
    data: { status: parsed.data.status },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      billingRegion: true,
      planId: true,
      onboardingCompleted: true,
      trialEndsAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      agencyId: id,
      actorId: auth.session.user.id,
      action: `admin.agency_${parsed.data.status.toLowerCase()}`,
      resourceType: "agency",
      resourceId: id,
      metadata: { previousStatus: agency.status },
    },
  });

  return NextResponse.json({ agency: updated });
}
