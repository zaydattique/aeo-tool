import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { readJsonBody } from "@/lib/request-security";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brandName: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  keywords: z.array(z.string().max(100)).max(50).optional(),
  rescanEnabled: z.boolean().optional(),
  rescanIntervalDays: z.number().int().min(1).max(90).optional(),
});

async function getOwnedClient(clientId: string, agencyId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, agencyId, deletedAt: null },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, agencyId, deletedAt: null },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          stage: true,
          progress: true,
          startedAt: true,
          completedAt: true,
          errorMessage: true,
          createdAt: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}

export async function PATCH(
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

  const { id } = await params;
  const existing = await getOwnedClient(id, auth.agencyId);
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  try {
    const body = await readJsonBody<unknown>(req);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.brandName !== undefined)
      data.brandName = parsed.data.brandName?.trim() || null;
    if (parsed.data.location !== undefined)
      data.location = parsed.data.location?.trim() || null;
    if (parsed.data.keywords !== undefined) data.keywords = parsed.data.keywords;

    if (parsed.data.rescanIntervalDays !== undefined) {
      data.rescanIntervalDays = parsed.data.rescanIntervalDays;
    }

    if (parsed.data.rescanEnabled !== undefined) {
      data.rescanEnabled = parsed.data.rescanEnabled;
      if (parsed.data.rescanEnabled) {
        const days =
          parsed.data.rescanIntervalDays ??
          existing.rescanIntervalDays ??
          7;
        data.nextRescanAt = new Date(Date.now() + days * 86400000);
      } else {
        data.nextRescanAt = null;
      }
    } else if (
      parsed.data.rescanIntervalDays !== undefined &&
      existing.rescanEnabled
    ) {
      data.nextRescanAt = new Date(
        Date.now() + parsed.data.rescanIntervalDays * 86400000
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    return NextResponse.json({ client });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    console.error("Update client error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!canManageClients(auth.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getOwnedClient(id, auth.agencyId);
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  await prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      agencyId: auth.agencyId,
      actorId: auth.session.user.id,
      action: "client.deleted",
      resourceType: "client",
      resourceId: id,
    },
  });

  return NextResponse.json({ success: true });
}
