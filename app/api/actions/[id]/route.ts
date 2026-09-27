import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";

const updateSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "SKIPPED"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

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

  const existing = await prisma.action.findFirst({
    where: { id, agencyId: auth.agencyId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
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

    const data: {
      status?: "TODO" | "IN_PROGRESS" | "DONE" | "SKIPPED";
      assignedToId?: string | null;
      completedAt?: Date | null;
      completedById?: string | null;
    } = {};

    if (parsed.data.status !== undefined) {
      data.status = parsed.data.status;

      if (parsed.data.status === "DONE") {
        data.completedAt = new Date();
        data.completedById = auth.session.user.id;
      } else if (existing.status === "DONE") {
        // Re-opened
        data.completedAt = null;
        data.completedById = null;
      }
    }

    if (parsed.data.assignedToId !== undefined) {
      if (parsed.data.assignedToId) {
        // Verify assignee belongs to same agency
        const assignee = await prisma.user.findFirst({
          where: {
            id: parsed.data.assignedToId,
            agencyId: auth.agencyId,
            deletedAt: null,
          },
        });
        if (!assignee) {
          return NextResponse.json(
            { error: "Assignee not found in agency" },
            { status: 400 }
          );
        }
      }
      data.assignedToId = parsed.data.assignedToId;
    }

    const action = await prisma.action.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, fullName: true, email: true },
        },
        completedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId: auth.agencyId,
        actorId: auth.session.user.id,
        action: data.status
          ? `action.status_${data.status.toLowerCase()}`
          : "action.updated",
        resourceType: "action",
        resourceId: id,
        metadata: data,
      },
    });

    return NextResponse.json({ action });
  } catch (err) {
    console.error("Update action error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
