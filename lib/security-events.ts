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

export function requestIp(_request: Request): string | null {
  // Request forwarding headers are not a trusted identity source. IP metadata
  // must come from the deployment edge/trusted proxy adapter, not user input.
  return null;
}

export function requestUserAgent(_request: Request): string | null {
  // User-Agent is optional telemetry and is intentionally not trusted or persisted
  // from arbitrary request headers by the application security layer.
  return null;
}
