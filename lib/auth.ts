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
      }

      if (trigger === "update" && session) {
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
        if (session.agencyName !== undefined) {
          token.agencyName = session.agencyName;
        }
        if (session.agencyId !== undefined) {
          token.agencyId = session.agencyId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.agencyId = token.agencyId;
        session.user.agencyName = token.agencyName;
        session.user.onboardingCompleted = token.onboardingCompleted;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
