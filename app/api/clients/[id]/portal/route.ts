import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { readJsonBody } from "@/lib/request-security";
import { generateCapabilityToken, hashCapabilityToken } from "@/lib/capability-tokens";

const bodySchema = z.object({
  action: z.enum(["enable", "disable", "rotate"]),
});

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
    select: {
      id: true,
      portalEnabled: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({
    portalEnabled: client.portalEnabled,
    portalPath: null,
  });
}

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

  const { id } = await params;
  const existing = await prisma.client.findFirst({
    where: { id, agencyId: auth.agencyId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(req));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { action } = parsed.data;
    let rawPortalToken: string | null = null;
    const data: {
      portalEnabled?: boolean;
      portalTokenHash?: string | null;
    } = {};

    if (action === "enable") {
      rawPortalToken = generateCapabilityToken(24);
      data.portalEnabled = true;
      data.portalTokenHash = hashCapabilityToken(rawPortalToken);
    } else if (action === "disable") {
      data.portalEnabled = false;
      data.portalTokenHash = null;
    } else {
      rawPortalToken = generateCapabilityToken(24);
      data.portalEnabled = true;
      data.portalTokenHash = hashCapabilityToken(rawPortalToken);
    }

    const client = await prisma.client.update({
      where: { id },
      data,
      select: {
        id: true,
        portalEnabled: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId: auth.agencyId,
        actorId: auth.session.user.id,
        action: `client.portal.${action}`,
        resourceType: "client",
        resourceId: id,
        metadata: { portalEnabled: client.portalEnabled },
      },
    });

    return NextResponse.json({
      portalEnabled: client.portalEnabled,
      portalToken: rawPortalToken,
      portalPath:
        client.portalEnabled && rawPortalToken
          ? `/p/${rawPortalToken}`
          : null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    console.error("Portal toggle error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
