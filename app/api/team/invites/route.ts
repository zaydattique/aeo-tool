import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/session";
import { getUsageSummary } from "@/lib/usage";
import { readJsonBody } from "@/lib/request-security";
import { rateLimit } from "@/lib/rate-limit";
import { teamInviteLimit, teamInviteWindowMs } from "@/lib/expensive-rate-limits";

const createSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(["AGENCY_OWNER", "AGENCY_MEMBER"]).default("AGENCY_MEMBER"),
});

export async function GET() {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [members, invites] = await Promise.all([
    prisma.user.findMany({
      where: { agencyId: auth.agencyId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.teamInvite.findMany({
      where: {
        agencyId: auth.agencyId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, email: true, role: true, expiresAt: true, acceptedAt: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ members, invites });
}

export async function POST(req: NextRequest) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Only owners can invite
  if (
    auth.session.user.role !== "AGENCY_OWNER" &&
    auth.session.user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json({ error: "Only owners can invite" }, { status: 403 });
  }

  const rl = await rateLimit(`team-invite:${auth.agencyId}`, teamInviteLimit(), teamInviteWindowMs());
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many team invitations. Try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  try {
    const body = await readJsonBody<unknown>(req);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const usage = await getUsageSummary(auth.agencyId);
    if (usage.limits?.seatsAtLimit) {
      return NextResponse.json(
        { error: "Team seat limit reached. Upgrade your plan." },
        { status: 403 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Upsert invite for same email
    const existingInvite = await prisma.teamInvite.findUnique({
      where: {
        agencyId_email: { agencyId: auth.agencyId, email },
      },
    });

    let invite;
    if (existingInvite && !existingInvite.acceptedAt) {
      invite = await prisma.teamInvite.update({
        where: { id: existingInvite.id },
        data: {
          token,
          role: parsed.data.role,
          expiresAt,
          invitedById: auth.session.user.id,
        },
      });
    } else if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already accepted" },
        { status: 409 }
      );
    } else {
      invite = await prisma.teamInvite.create({
        data: {
          agencyId: auth.agencyId,
          email,
          role: parsed.data.role,
          token,
          expiresAt,
          invitedById: auth.session.user.id,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        agencyId: auth.agencyId,
        actorId: auth.session.user.id,
        action: "team.invited",
        resourceType: "team_invite",
        resourceId: invite.id,
        metadata: { email, role: parsed.data.role },
      },
    });

    const inviteUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;

    return NextResponse.json({
      invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
      inviteUrl,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    console.error("Invite error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
