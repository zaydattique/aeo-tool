import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brandName: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  keywords: z.array(z.string().max(100)).max(50).optional(),
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
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name.trim() }),
        ...(parsed.data.brandName !== undefined && {
          brandName: parsed.data.brandName?.trim() || null,
        }),
        ...(parsed.data.location !== undefined && {
          location: parsed.data.location?.trim() || null,
        }),
        ...(parsed.data.keywords !== undefined && {
          keywords: parsed.data.keywords,
        }),
      },
    });

    return NextResponse.json({ client });
  } catch (err) {
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
