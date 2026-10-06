import { prisma } from "@/lib/prisma";

export type SecurityEventInput = {
  userId?: string | null;
  agencyId?: string | null;
  eventType: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  targetType?: string | null;
  targetId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordSecurityEvent(input: SecurityEventInput): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId: input.userId ?? null,
        agencyId: input.agencyId ?? null,
        eventType: input.eventType,
        severity: input.severity ?? "INFO",
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to record security event", error);
  }
}

export function requestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

export function requestUserAgent(request: Request): string | null {
  return request.headers.get("user-agent");
}
