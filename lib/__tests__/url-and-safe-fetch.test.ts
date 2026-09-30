import { describe, it, expect } from "vitest";
import { validateWebsiteUrl } from "../url";
import { isBlockedIp } from "../safe-fetch";

describe("validateWebsiteUrl", () => {
  it("accepts public https domains", () => {
    const r = validateWebsiteUrl("https://example.com/path");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toContain("example.com");
  });

  it("rejects credentials in URL", () => {
    expect(validateWebsiteUrl("https://user:pass@example.com").ok).toBe(false);
  });

  it("rejects IP-literal hosts", () => {
    expect(validateWebsiteUrl("https://127.0.0.1").ok).toBe(false);
    expect(validateWebsiteUrl("https://169.254.169.254").ok).toBe(false);
    expect(validateWebsiteUrl("https://10.0.0.1").ok).toBe(false);
    expect(validateWebsiteUrl("https://192.168.1.1").ok).toBe(false);
    expect(validateWebsiteUrl("https://172.16.0.1").ok).toBe(false);
    expect(validateWebsiteUrl("https://0.0.0.0").ok).toBe(false);
    expect(validateWebsiteUrl("https://[::1]").ok).toBe(false);
    expect(validateWebsiteUrl("https://2130706433").ok).toBe(false);
    expect(validateWebsiteUrl("https://0x7f000001").ok).toBe(false);
  });

  it("rejects non-public TLDs and localhost", () => {
    expect(validateWebsiteUrl("https://foo.local").ok).toBe(false);
    expect(validateWebsiteUrl("https://foo.internal").ok).toBe(false);
    expect(validateWebsiteUrl("https://foo.localhost").ok).toBe(false);
    expect(validateWebsiteUrl("https://foo.lan").ok).toBe(false);
    expect(validateWebsiteUrl("http://localhost").ok).toBe(false);
  });

  it("rejects non-http schemes and odd ports", () => {
    expect(validateWebsiteUrl("ftp://example.com").ok).toBe(false);
    expect(validateWebsiteUrl("https://example.com:8080").ok).toBe(false);
  });
});

describe("isBlockedIp", () => {
  it("blocks loopback, private, link-local, CGNAT, multicast", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("127.1.2.3")).toBe(true);
    expect(isBlockedIp("10.1.2.3")).toBe(true);
    expect(isBlockedIp("192.168.0.1")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("172.31.255.255")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("100.64.0.1")).toBe(true);
    expect(isBlockedIp("0.0.0.0")).toBe(true);
    expect(isBlockedIp("224.0.0.1")).toBe(true);
    expect(isBlockedIp("::1")).toBe(true);
  });

  it("allows public IPv4", () => {
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("1.1.1.1")).toBe(false);
    expect(isBlockedIp("93.184.216.34")).toBe(false);
  });

  it("blocks IPv4-mapped loopback", () => {
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
  });
});
