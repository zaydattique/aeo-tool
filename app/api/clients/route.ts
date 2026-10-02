import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { validateWebsiteUrl, suggestBrandName } from "@/lib/url";

const createSchema = z.object({
  websiteUrl: z.string().min(1).max(2048),
  name: z.string().min(1).max(200).optional(),
  brandName: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  keywords: z.array(z.string().max(100)).max(50).optional(),
});

export async function GET(req: NextRequest) {
  const { error, status, agencyId } = await requireAgency();
  if (error || !agencyId) {
    return NextResponse.json({ error }, { status });
  }

  const rawLimit = Number.parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 50;

  const clients = await prisma.client.findMany({
    where: { agencyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      brandName: true,
      location: true,
      keywords: true,
      currentVisibilityScore: true,
      lastScannedAt: true,
      status: true,
      createdAt: true,
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          stage: true,
          progress: true,
        },
      },
    },
  });

  const hasMore = clients.length > limit;
  return NextResponse.json({ clients: hasMore ? clients.slice(0, limit) : clients, hasMore });
}

export async function POST(req: NextRequest) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!canManageClients(auth.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const urlResult = validateWebsiteUrl(parsed.data.websiteUrl);
    if (!urlResult.ok) {
      return NextResponse.json({ error: urlResult.error }, { status: 400 });
    }

    // Plan limit check
    const agency = await prisma.agency.findUnique({
      where: { id: auth.agencyId },
      include: { plan: true },
    });

    if (agency?.plan) {
      const count = await prisma.client.count({
        where: { agencyId: auth.agencyId, deletedAt: null },
      });
      if (count >= agency.plan.maxClients) {
        return NextResponse.json(
          {
            error: `Plan limit reached (${agency.plan.maxClients} clients). Upgrade to add more.`,
          },
          { status: 403 }
        );
      }
    }

    const brandName =
      parsed.data.brandName?.trim() ||
      suggestBrandName(urlResult.url);
    const name =
      parsed.data.name?.trim() || brandName || urlResult.url;

    const client = await prisma.client.create({
      data: {
        agencyId: auth.agencyId,
        websiteUrl: urlResult.url,
        name,
        brandName: brandName || null,
        location: parsed.data.location?.trim() || null,
        keywords: parsed.data.keywords || [],
        status: "ACTIVE",
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId: auth.agencyId,
        actorId: auth.session.user.id,
        action: "client.created",
        resourceType: "client",
        resourceId: client.id,
        metadata: { websiteUrl: client.websiteUrl, name: client.name },
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    console.error("Create client error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
