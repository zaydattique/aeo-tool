import type { NextRequest } from "next/server";

export function getClientIp(_req: NextRequest): string {
  // Client IP identity belongs to the trusted deployment edge. Do not infer it
  // from application-visible forwarding headers because those can be spoofed.
  return "unknown";
}

export const DEFAULT_MAX_JSON_BODY_BYTES = 1024 * 1024;

export async function readJsonBody<T>(
  req: NextRequest,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): Promise<T> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("INVALID_REQUEST_BODY");

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new Error("REQUEST_BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") throw err;
    throw new Error("INVALID_REQUEST_BODY");
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body)) as T;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export async function readJsonResponse<T>(
  res: Response,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): Promise<T> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("INVALID_RESPONSE_BODY");

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new Error("RESPONSE_BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof Error && err.message === "RESPONSE_BODY_TOO_LARGE") throw err;
    throw new Error("INVALID_RESPONSE_BODY");
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body)) as T;
  } catch {
    throw new Error("INVALID_JSON_RESPONSE");
  }
}
