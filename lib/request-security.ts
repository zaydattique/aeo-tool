import type { NextRequest } from "next/server";

export function getClientIp(_req: NextRequest): string {
  // Client IP identity belongs to the trusted deployment edge. Do not infer it
  // from application-visible request headers because those can be spoofed.
  return "unknown";
}


export const DEFAULT_MAX_JSON_BODY_BYTES = 1024 * 1024;

export async function readJsonBody<T>(
  req: NextRequest,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): Promise<T> {
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
  const body = await res.arrayBuffer();
  if (body.byteLength > maxBytes) {
    throw new Error("RESPONSE_BODY_TOO_LARGE");
  }
  return JSON.parse(new TextDecoder().decode(body)) as T;
}