import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/request-security";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
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
      const currentInvite = await tx.teamInvite.findUnique({
        where: { id: invite.id },
        select: { acceptedAt: true, expiresAt: true, agencyId: true, role: true },
      });
      if (!currentInvite || currentInvite.acceptedAt || currentInvite.expiresAt <= new Date()) {
        throw new Error("INVITE_ALREADY_USED");
      }

      const agency = await tx.agency.findUnique({
        where: { id: currentInvite.agencyId },
        include: { plan: true },
      });
      if (!agency || agency.deletedAt || agency.status === "CANCELLED") {
        throw new Error("AGENCY_INACTIVE");
      }

      if (agency.plan) {
        const seatCount = await tx.user.count({
          where: { agencyId: currentInvite.agencyId, deletedAt: null },
        });
        if (seatCount >= agency.plan.maxTeamSeats) {
          throw new Error("SEAT_LIMIT_REACHED");
        }
      }

      const newUser = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          fullName: fullName.trim(),
          role: currentInvite.role,
          agencyId: currentInvite.agencyId,
          emailVerified: new Date(),
        },
      });

      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          agencyId: currentInvite.agencyId,
          actorId: newUser.id,
          action: "team.invite_accepted",
          resourceType: "user",
          resourceId: newUser.id,
          metadata: { role: currentInvite.role },
        },
      });

      return newUser;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Invite accepted. You can now log in.",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVITE_ALREADY_USED") return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
    if (err instanceof Error && err.message === "AGENCY_INACTIVE") return NextResponse.json({ error: "Agency is no longer active" }, { status: 400 });
    if (err instanceof Error && err.message === "SEAT_LIMIT_REACHED") return NextResponse.json({ error: "Team seat limit reached. Ask the agency owner to upgrade the plan." }, { status: 403 });
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") return NextResponse.json({ error: "Concurrent invite acceptance detected. Please retry." }, { status: 409 });
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
