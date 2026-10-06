import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const PERIOD_SECONDS = 30;
const DIGITS = 6;

function keyFromSecret(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required for MFA");
  return crypto.createHash("sha256").update(secret).digest();
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function base32Encode(input: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let current = 0;
  const bytes: number[] = [];
  for (const char of value.toUpperCase().replace(/=+$/, "")) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 secret");
    current = (current << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((current >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totpForCounter(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

export function verifyTotp(secret: string, code: string, nowMs = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(nowMs / 1000 / PERIOD_SECONDS);
  return [-1, 0, 1].some((offset) =>
    crypto.timingSafeEqual(
      Buffer.from(totpForCounter(secret, counter + offset)),
      Buffer.from(code)
    )
  );
}

export function buildOtpAuthUri(secret: string, email: string): string {
  const issuer = "Threezero AEO";
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function encryptMfaSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyFromSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptMfaSecret(payload: string): string {
  const raw = Buffer.from(payload, "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyFromSecret(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function createRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () =>
    `${crypto.randomBytes(4).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
  );
}

export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(code.replace(/-/g, "").toUpperCase(), 12);
}

export async function consumeRecoveryCode(
  records: Array<{ id: string; codeHash: string; usedAt: Date | null }>,
  code: string
): Promise<string | null> {
  const normalized = code.replace(/-/g, "").toUpperCase();
  for (const record of records) {
    if (record.usedAt) continue;
    if (await bcrypt.compare(normalized, record.codeHash)) return record.id;
  }
  return null;
}
