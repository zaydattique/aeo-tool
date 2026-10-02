import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { rateLimit } from "./rate-limit";

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
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
