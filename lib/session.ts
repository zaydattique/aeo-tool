import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { UserRole } from "@prisma/client";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" as const, status: 401 as const, session: null };
  }

  return { error: null, status: 200 as const, session };
}

export async function requireAgency() {
  const result = await requireAuth();
  if (result.error || !result.session) {
    return { ...result, agencyId: null };
  }

  const { session } = result;

  if (
    session.user.role === "SUPER_ADMIN" &&
    session.user.agencyId &&
    session.user.impersonationExpiresAt != null &&
    session.user.impersonationExpiresAt <= Date.now()
  ) {
    return {
      error: "Impersonation session expired" as const,
      status: 403 as const,
      session,
      agencyId: null,
    };
  }

  if (session.user.role === "SUPER_ADMIN" && !session.user.agencyId) {
    return {
      error: "Super admin must impersonate an agency" as const,
      status: 403 as const,
      session,
      agencyId: null,
    };
  }

  if (!session.user.agencyId) {
    return {
      error: "No agency associated with this account" as const,
      status: 403 as const,
      session,
      agencyId: null,
    };
  }

  return {
    error: null,
    status: 200 as const,
    session,
    agencyId: session.user.agencyId,
  };
}

export function canManageClients(role: UserRole) {
  return (
    role === "AGENCY_OWNER" ||
    role === "AGENCY_MEMBER" ||
    role === "SUPER_ADMIN"
  );
}
