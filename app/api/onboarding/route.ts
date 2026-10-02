import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/request-security";

const schema = z.object({
  agencyName: z.string().min(1).max(120).optional(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  complete: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "AGENCY_OWNER" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await readJsonBody<unknown>(req);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agencyName, logoUrl, complete } = parsed.data;

    const data: {
      name?: string;
      logoUrl?: string | null;
      onboardingCompleted?: boolean;
    } = {};

    if (agencyName) data.name = agencyName.trim();
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (complete) data.onboardingCompleted = true;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const agency = await prisma.agency.update({
      where: { id: session.user.agencyId },
      data,
    });

    await prisma.activityLog.create({
      data: {
        agencyId: agency.id,
        actorId: session.user.id,
        action: complete ? "agency.onboarding_completed" : "agency.updated",
        resourceType: "agency",
        resourceId: agency.id,
        metadata: data,
      },
    });

    return NextResponse.json({
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        logoUrl: agency.logoUrl,
        onboardingCompleted: agency.onboardingCompleted,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    console.error("Onboarding error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
