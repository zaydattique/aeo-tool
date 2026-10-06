import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/request-security";
import { rateLimit } from "@/lib/rate-limit";
import { createRecoveryCodes, decryptMfaSecret, hashRecoveryCode, verifyTotp } from "@/lib/mfa";
import { recordSecurityEvent, requestIp, requestUserAgent } from "@/lib/security-events";

const schema = z.object({
  setupToken: z.string().min(20).max(200),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<unknown>(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid setup data" }, { status: 400 });

    const hash = crypto.createHash("sha256").update(parsed.data.setupToken).digest("hex");
    const user = await prisma.user.findFirst({
      where: { mfaSetupTokenHash: hash, mfaSetupExpiresAt: { gt: new Date() }, deletedAt: null },
      select: { id: true, agencyId: true, role: true, mfaSecretCiphertext: true },
    });
    if (!user?.mfaSecretCiphertext || !["SUPER_ADMIN", "AGENCY_OWNER"].includes(user.role)) {
      return NextResponse.json({ error: "MFA setup expired" }, { status: 400 });
    }

    const rl = await rateLimit(`mfa-confirm:${user.id}`, 10, 10 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

    if (!verifyTotp(decryptMfaSecret(user.mfaSecretCiphertext), parsed.data.code)) {
      await recordSecurityEvent({ userId: user.id, agencyId: user.agencyId, eventType: "auth.mfa_setup_invalid_code", severity: "WARNING", ip: requestIp(req), userAgent: requestUserAgent(req) });
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });
    }

    const codes = createRecoveryCodes();
    await prisma.$transaction(async (tx) => {
      await tx.mfaRecoveryCode.deleteMany({ where: { userId: user.id } });
      await tx.mfaRecoveryCode.createMany({
        data: await Promise.all(codes.map(async (code) => ({ userId: user.id, codeHash: await hashRecoveryCode(code) }))),
      });
      await tx.user.update({
        where: { id: user.id },
        data: { mfaEnabled: true, mfaSetupTokenHash: null, mfaSetupExpiresAt: null },
      });
      await tx.securityEvent.create({
        data: { userId: user.id, agencyId: user.agencyId, eventType: "auth.mfa_enabled", metadata: { recoveryCodeCount: codes.length } },
      });
    });

    return NextResponse.json({ enabled: true, recoveryCodes: codes });
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_BODY_TOO_LARGE") {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    console.error("MFA confirm:", error);
    return NextResponse.json({ error: "Unable to enable MFA" }, { status: 500 });
  }
}
