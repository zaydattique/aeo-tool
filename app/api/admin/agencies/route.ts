import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { readJsonBody } from "@/lib/request-security";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.floor(rawLimit))) : 50;
  const rawOffset = Number(req.nextUrl.searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;

  const [agencies, totalAgencies, active, trial, suspended] = await Promise.all([
    prisma.agency.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit + 1,
      include: {
        plan: { select: { name: true, slug: true } },
        _count: { select: { users: true, clients: true, scans: true } },
      },
    }),
    prisma.agency.count({ where: { deletedAt: null } }),
    prisma.agency.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.agency.count({ where: { deletedAt: null, status: "TRIAL" } }),
    prisma.agency.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
  ]);

  const hasMore = agencies.length > limit;
  agencies.splice(limit);

  const metrics = { totalAgencies, active, trial, suspended };

  return NextResponse.json({ agencies, metrics, pagination: { offset, limit, hasMore } });
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
    const body = await readJsonBody<unknown>(req);
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
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002") return NextResponse.json({ error: "Agency or owner email already exists" }, { status: 409 });
    console.error("Admin create agency:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
