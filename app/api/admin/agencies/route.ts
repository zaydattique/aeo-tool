import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agencies = await prisma.agency.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      plan: { select: { name: true, slug: true } },
      _count: {
        select: {
          users: true,
          clients: true,
          scans: true,
        },
      },
    },
  });

  const metrics = {
    totalAgencies: agencies.length,
    active: agencies.filter((a) => a.status === "ACTIVE").length,
    trial: agencies.filter((a) => a.status === "TRIAL").length,
    suspended: agencies.filter((a) => a.status === "SUSPENDED").length,
  };

  return NextResponse.json({ agencies, metrics });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1).max(120),
  ownerPassword: z.string().min(8).max(128),
  billingRegion: z.enum(["PAKISTAN", "INTERNATIONAL"]).default("PAKISTAN"),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.ownerEmail.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    let baseSlug = slugify(parsed.data.name) || "agency";
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.agency.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const planSlug =
      parsed.data.billingRegion === "PAKISTAN" ? "starter-pk" : "starter-int";
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    const passwordHash = await bcrypt.hash(parsed.data.ownerPassword, 12);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: parsed.data.name.trim(),
          slug,
          status: "TRIAL",
          billingRegion: parsed.data.billingRegion,
          planId: plan?.id,
          trialEndsAt,
          createdBySuperAdmin: true,
          onboardingCompleted: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName: parsed.data.ownerName.trim(),
          role: "AGENCY_OWNER",
          agencyId: agency.id,
          emailVerified: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId: agency.id,
          actorId: auth.session!.user.id,
          action: "admin.agency_created",
          resourceType: "agency",
          resourceId: agency.id,
        },
      });

      return { agency, user };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Admin create agency:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
