import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  // These headers are only trustworthy when the public edge/proxy strips and
  // rewrites client-supplied forwarding headers.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}


export const DEFAULT_MAX_JSON_BODY_BYTES = 1024 * 1024;

export async function readJsonBody<T>(
  req: NextRequest,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): Promise<T> {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const length = Number(contentLength);
    if (!Number.isFinite(length) || length < 0 || length > maxBytes) {
      throw new Error("REQUEST_BODY_TOO_LARGE");
    }
  }

  const body = await req.arrayBuffer();
  if (body.byteLength > maxBytes) {
    throw new Error("REQUEST_BODY_TOO_LARGE");
  }

  const text = new TextDecoder().decode(body);
  return JSON.parse(text) as T;
}

export async function readJsonResponse<T>(
  res: Response,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): Promise<T> {
  const contentLength = res.headers.get("content-length");
  if (contentLength) {
    const length = Number(contentLength);
    if (!Number.isFinite(length) || length < 0 || length > maxBytes) {
      throw new Error("RESPONSE_BODY_TOO_LARGE");
    }
  }
  const body = await res.arrayBuffer();
  if (body.byteLength > maxBytes) {
    throw new Error("RESPONSE_BODY_TOO_LARGE");
  }
  return JSON.parse(new TextDecoder().decode(body)) as T;
}