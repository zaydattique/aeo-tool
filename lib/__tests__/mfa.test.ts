import { describe, expect, it, beforeEach } from "vitest";
import {
  buildOtpAuthUri,
  createRecoveryCodes,
  decryptMfaSecret,
  encryptMfaSecret,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotp,
} from "../mfa";

describe("MFA security primitives", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret-that-is-long-enough-for-mfa";
  });

  it("encrypts and decrypts TOTP secrets without exposing plaintext in ciphertext", () => {
    const secret = generateTotpSecret();
    const ciphertext = encryptMfaSecret(secret);
    expect(ciphertext).not.toContain(secret);
    expect(decryptMfaSecret(ciphertext)).toBe(secret);
  });

  it("builds a standards-compatible otpauth URI", () => {
    const uri = buildOtpAuthUri("JBSWY3DPEHPK3PXP", "owner@example.com");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });

  it("rejects malformed TOTP codes", () => {
    expect(verifyTotp("JBSWY3DPEHPK3PXP", "12345")).toBe(false);
    expect(verifyTotp("JBSWY3DPEHPK3PXP", "abcdef")).toBe(false);
  });

  it("generates unique recovery codes and stores only hashes", async () => {
    const codes = createRecoveryCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    const hash = await hashRecoveryCode(codes[0]);
    expect(hash).not.toContain(codes[0].replace(/-/g, ""));
  });
});
