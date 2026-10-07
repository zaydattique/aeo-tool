import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" as const, status: 401 as const, session: null };
  }

  const tokenId = session.user.sessionId;
  if (!tokenId) {
    return { error: "Invalid session" as const, status: 401 as const, session: null };
  }

  const stored = await prisma.userSession.findFirst({
    where: {
      tokenId,
      userId: session.user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      expiresAt: true,
      lastActiveAt: true,
      user: {
        select: {
          role: true,
          deletedAt: true,
          agency: {
            select: {
              status: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  });

  if (
    !stored ||
    stored.user.deletedAt ||
    stored.user.role !== session.user.role ||
    (stored.user.role !== "SUPER_ADMIN" &&
      (!stored.user.agency || stored.user.agency.deletedAt || stored.user.agency.status === "SUSPENDED" || stored.user.agency.status === "CANCELLED"))
  ) {
    return { error: "Session expired or revoked" as const, status: 401 as const, session: null };
  }

  if (stored.lastActiveAt.getTime() < Date.now() - 5 * 60 * 1000) {
    await prisma.userSession.update({
      where: { id: stored.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => undefined);
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
