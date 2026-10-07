import { describe,expect,it,beforeEach,afterEach } from "vitest";
import { encryptProviderSecret,decryptProviderSecret,fingerprintSecret,providerEnvConfigured } from "@/lib/provider-control";
describe("provider control",()=>{
 const old=process.env.NEXTAUTH_SECRET;
 beforeEach(()=>{process.env.NEXTAUTH_SECRET="phase2-test-secret";});
 afterEach(()=>{if(old===undefined)delete process.env.NEXTAUTH_SECRET;else process.env.NEXTAUTH_SECRET=old;});
 it("encrypts and decrypts provider credentials without plaintext persistence",()=>{
  const secret="sk-test-123";const encrypted=encryptProviderSecret(secret);
  expect(encrypted).not.toContain(secret);expect(decryptProviderSecret(encrypted)).toBe(secret);
 });
 it("creates stable non-secret fingerprints",()=>{
  expect(fingerprintSecret("same")).toBe(fingerprintSecret("same"));expect(fingerprintSecret("same")).not.toBe(fingerprintSecret("different"));expect(fingerprintSecret("same")).not.toContain("same");
 });
 it("detects environment configuration without returning credentials",()=>{
  process.env.OPENAI_API_KEY="test-key";expect(providerEnvConfigured("openai")).toBe(true);delete process.env.OPENAI_API_KEY;
 });
});