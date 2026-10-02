import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/request-security";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120),
  agencyName: z.string().min(1).max(120),
  billingRegion: z.enum(["PAKISTAN", "INTERNATIONAL"]).default("PAKISTAN"),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many signup attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await readJsonBody<unknown>(req);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, fullName, agencyName, billingRegion } =
      parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const emailRl = await rateLimit(`signup-email:${normalizedEmail}`, 3, 60 * 60 * 1000);
    if (!emailRl.ok) {
      return NextResponse.json(
        { error: "Too many signup attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(emailRl.retryAfterSec) } }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    let baseSlug = slugify(agencyName) || "agency";
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.agency.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const planSlug =
      billingRegion === "PAKISTAN" ? "starter-pk" : "starter-int";
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: agencyName.trim(),
          slug,
          status: "TRIAL",
          billingRegion,
          planId: plan?.id,
          trialEndsAt,
          onboardingCompleted: false,
        },
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: fullName.trim(),
          role: "AGENCY_OWNER",
          agencyId: agency.id,
          emailVerified: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId: agency.id,
          actorId: user.id,
          action: "agency.created",
          resourceType: "agency",
          resourceId: agency.id,
          metadata: { via: "signup", billingRegion },
        },
      });

      return { agency, user };
    });

    return NextResponse.json({
      success: true,
      userId: result.user.id,
      agencyId: result.agency.id,
      message: "Account created. Please log in.",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
