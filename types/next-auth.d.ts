import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      agencyId: string | null;
      agencyName: string | null;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    agencyId: string | null;
    agencyName: string | null;
    onboardingCompleted: boolean;
    impersonationExpiresAt?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    agencyId: string | null;
    agencyName: string | null;
    onboardingCompleted: boolean;
    impersonationExpiresAt?: number | null;
  }
}
