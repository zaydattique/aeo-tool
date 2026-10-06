import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/request-security";
import { createHash } from "crypto";
import { recordSecurityEvent } from "@/lib/security-events";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`reset-password:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await readJsonBody<unknown>(req);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const tokenKey = createHash("sha256").update(token).digest("hex").slice(0, 32);
    const tokenRl = await rateLimit(`reset-password-token:${tokenKey}`, 10, 60 * 60 * 1000);
    if (!tokenRl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(tokenRl.retryAfterSec) } }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const updated = await prisma.user.updateMany({
      where: {
        id: user.id,
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    if (updated.count !== 1) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    await prisma.userSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordSecurityEvent({ userId: user.id, agencyId: user.agencyId, eventType: "auth.password_reset", severity: "WARNING" });

    return NextResponse.json({
      success: true,
      message: "Password updated. You can now log in.",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
