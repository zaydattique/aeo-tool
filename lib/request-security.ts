import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  // These headers are only trustworthy when the public edge/proxy strips and
  // rewrites client-supplied forwarding headers.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
