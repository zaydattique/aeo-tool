import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/request-security";
import { rateLimit } from "@/lib/rate-limit";
import { buildOtpAuthUri, encryptMfaSecret, generateTotpSecret } from "@/lib/mfa";
import { recordSecurityEvent, requestIp, requestUserAgent } from "@/lib/security-events";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<unknown>(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

    const email = parsed.data.email.toLowerCase().trim();
    const rl = await rateLimit(`mfa-setup:${email}`, 5, 15 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true, passwordHash: true, role: true, agencyId: true, mfaEnabled: true },
    });

    if (!user?.passwordHash || !["SUPER_ADMIN", "AGENCY_OWNER"].includes(user.role) || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      await recordSecurityEvent({ eventType: "auth.mfa_setup_failed", severity: "WARNING", ip: requestIp(req), userAgent: requestUserAgent(req), metadata: { email } });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.mfaEnabled) return NextResponse.json({ error: "MFA is already enabled" }, { status: 409 });

    const secret = generateTotpSecret();
    const setupToken = crypto.randomBytes(32).toString("base64url");
    const setupTokenHash = crypto.createHash("sha256").update(setupToken).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecretCiphertext: encryptMfaSecret(secret),
        mfaSetupTokenHash: setupTokenHash,
        mfaSetupExpiresAt: expiresAt,
      },
    });

    await recordSecurityEvent({
      userId: user.id,
      agencyId: user.agencyId,
      eventType: "auth.mfa_setup_started",
      ip: requestIp(req),
      userAgent: requestUserAgent(req),
    });

    return NextResponse.json({
      setupToken,
      secret,
      otpauthUri: buildOtpAuthUri(secret, user.email),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_BODY_TOO_LARGE") {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    console.error("MFA setup:", error);
    return NextResponse.json({ error: "Unable to start MFA setup" }, { status: 500 });
  }
}
