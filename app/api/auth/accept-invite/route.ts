import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/request-security";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`invite-accept:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many invite attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const body = await readJsonBody<unknown>(req);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password, fullName } = parsed.data;

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: { agency: true },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    if (invite.agency.deletedAt || invite.agency.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Agency is no longer active" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          fullName: fullName.trim(),
          role: invite.role,
          agencyId: invite.agencyId,
          emailVerified: new Date(),
        },
      });

      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          agencyId: invite.agencyId,
          actorId: newUser.id,
          action: "team.invite_accepted",
          resourceType: "user",
          resourceId: newUser.id,
          metadata: { role: invite.role },
        },
      });

      return newUser;
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Invite accepted. You can now log in.",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    console.error("Accept invite error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
