import { createHash, randomBytes } from "node:crypto";

export function generateCapabilityToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashCapabilityToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
