import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/request-security";

const schema = z.object({
  email: z.string().email().max(255),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await readJsonBody<unknown>(req);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const emailRl = await rateLimit(`forgot-password-email:${email}`, 3, 60 * 60 * 1000);
    if (!emailRl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(emailRl.retryAfterSec) } }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    console.log("[DEV] Password reset link:", resetUrl);

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
      ...(process.env.NODE_ENV === "development" ? { devResetUrl: resetUrl } : {}),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
