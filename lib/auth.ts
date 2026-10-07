import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { rateLimit } from "./rate-limit";
import crypto from "node:crypto";
import { consumeRecoveryCode, decryptMfaSecret, verifyTotp } from "./mfa";
import { recordSecurityEvent } from "./security-events";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Authenticator code", type: "text" },
        recoveryCode: { label: "Recovery code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        // Login throttle per email (and coarse global)
        const rl = await rateLimit(`login:${email}`, 20, 15 * 60 * 1000);
        if (!rl.ok) {
          throw new Error("TooManyLoginAttempts");
        }

        const user = await prisma.user.findFirst({
          where: {
            email,
            deletedAt: null,
          },
          include: {
            agency: {
              select: {
                id: true,
                name: true,
                onboardingCompleted: true,
                status: true,
                deletedAt: true,
              },
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) {
          await recordSecurityEvent({
            userId: user.id,
            agencyId: user.agencyId,
            eventType: "auth.login_failed",
            severity: "WARNING",
            ip: req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ?? null,
            userAgent: req.headers?.["user-agent"] ?? null,
          });
          return null;
        }

        if (
          user.role !== "SUPER_ADMIN" &&
          user.agency &&
          (user.agency.status === "SUSPENDED" ||
            user.agency.status === "CANCELLED" ||
            user.agency.deletedAt)
        ) {
          throw new Error("AgencySuspended");
        }

        if (user.role === "SUPER_ADMIN" || user.role === "AGENCY_OWNER") {
          if (!user.mfaEnabled || !user.mfaSecretCiphertext) {
            throw new Error("MFASetupRequired");
          }

          let mfaValid = false;
          if (credentials.totpCode) {
            try {
              mfaValid = verifyTotp(decryptMfaSecret(user.mfaSecretCiphertext), String(credentials.totpCode));
            } catch {
              mfaValid = false;
            }
          } else if (credentials.recoveryCode) {
            const records = await prisma.mfaRecoveryCode.findMany({
              where: { userId: user.id, usedAt: null },
              select: { id: true, codeHash: true, usedAt: true },
            });
            const recoveryId = await consumeRecoveryCode(records, String(credentials.recoveryCode));
            if (recoveryId) {
              const claimed = await prisma.mfaRecoveryCode.updateMany({
                where: { id: recoveryId, usedAt: null },
                data: { usedAt: new Date() },
              });
              if (claimed.count === 1) {
                mfaValid = true;
                await recordSecurityEvent({ userId: user.id, agencyId: user.agencyId, eventType: "auth.recovery_code_used", severity: "WARNING" });
              }
            }
          }
          if (!mfaValid) {
            await recordSecurityEvent({ userId: user.id, agencyId: user.agencyId, eventType: "auth.mfa_failed", severity: "WARNING" });
            throw new Error("MFARequired");
          }
        }

        const tokenId = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await prisma.userSession.create({
          data: {
            userId: user.id,
            agencyId: user.agencyId,
            tokenId,
            issuedAt: now,
            expiresAt,
            ip: req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ?? null,
            userAgent: req.headers?.["user-agent"] ?? null,
          },
        });

        await recordSecurityEvent({
          userId: user.id,
          agencyId: user.agencyId,
          eventType: "auth.login_success",
          ip: req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ?? null,
          userAgent: req.headers?.["user-agent"] ?? null,
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          agencyId: user.agencyId,
          agencyName: user.agency?.name ?? null,
          onboardingCompleted: user.agency?.onboardingCompleted ?? true,
          sessionId: tokenId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId;
        token.agencyName = user.agencyName;
        token.onboardingCompleted = user.onboardingCompleted;
        token.sessionId = user.sessionId;
        token.impersonationExpiresAt = null;
      }

      if (trigger === "update" && session) {
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
        if (session.agencyName !== undefined) {
          token.agencyName = session.agencyName;
        }
        // Only SUPER_ADMIN may change tenant context. Validate the target on
        // the server and time-box the resulting impersonation in the JWT.
        if (token.role === "SUPER_ADMIN" && session.agencyId !== undefined) {
          if (session.agencyId === null) {
            token.agencyId = null;
            token.agencyName = null;
            token.impersonationExpiresAt = null;
          } else {
            const agency = await prisma.agency.findFirst({
              where: { id: session.agencyId, deletedAt: null },
              select: { id: true, name: true, onboardingCompleted: true },
            });
            if (agency) {
              token.agencyId = agency.id;
              token.agencyName = agency.name;
              token.onboardingCompleted = agency.onboardingCompleted;
              token.impersonationExpiresAt = Date.now() + 60 * 60 * 1000;
            }
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const impersonationExpired =
          token.role === "SUPER_ADMIN" &&
          token.impersonationExpiresAt != null &&
          token.impersonationExpiresAt <= Date.now();
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.agencyId = impersonationExpired ? null : token.agencyId;
        session.user.agencyName = impersonationExpired ? null : token.agencyName;
        session.user.onboardingCompleted = impersonationExpired
          ? true
          : token.onboardingCompleted;
        session.user.impersonationExpiresAt = impersonationExpired
          ? null
          : token.impersonationExpiresAt;
        // Keep the revocation identifier server-only. It is deliberately non-enumerable so the NextAuth session endpoint cannot serialize it to the browser.\n        Object.defineProperty(session.user, "sessionId", {\n          value: token.sessionId,\n          enumerable: false,\n          configurable: false,\n          writable: false,\n        });
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sessionId) {
        await prisma.userSession.updateMany({
          where: { tokenId: String(token.sessionId), revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await recordSecurityEvent({
          userId: token.id ? String(token.id) : null,
          agencyId: token.agencyId ? String(token.agencyId) : null,
          eventType: "auth.logout",
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
