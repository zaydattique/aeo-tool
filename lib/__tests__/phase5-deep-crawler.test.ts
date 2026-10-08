import { describe, expect, it, vi, beforeEach } from "vitest";

const responses = new Map<string, { status: number; url: string; text: string; contentType?: string }>();

vi.mock("../safe-fetch", () => ({
  safeFetch: vi.fn(async (url: string) => {
    const r = responses.get(url);
    if (!r) throw new Error("fixture missing: " + url);
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      url: r.url,
      headers: new Headers({ "content-type": r.contentType || "text/html" }),
      text: async () => r.text,
      arrayBuffer: async () => new TextEncoder().encode(r.text).buffer,
    };
  }),
}));

import { deepCrawlWebsite } from "../deep-crawler";

const page = (body: string) =>
  '<html lang="en"><head><title>Test</title><meta name="description" content="desc"><link rel="canonical" href="https://example.test/"></head><body>' + body + "</body></html>";

describe("phase5 deep crawler", () => {
  beforeEach(() => responses.clear());

  it("crawls within page/depth bounds and normalizes internal links", async () => {
    responses.set("https://example.test/robots.txt", { status: 200, url: "https://example.test/robots.txt", text: "User-agent: *\nAllow: /", contentType: "text/plain" });
    responses.set("https://example.test/sitemap.xml", { status: 200, url: "https://example.test/sitemap.xml", text: "<urlset><url><loc>https://example.test/</loc></url></urlset>", contentType: "application/xml" });
    responses.set("https://example.test/llms.txt", { status: 404, url: "https://example.test/llms.txt", text: "no" });
    responses.set("https://example.test/", { status: 200, url: "https://example.test/", text: page('<h1>Home</h1><a href="/about">About</a>') });
    responses.set("https://example.test/about", { status: 200, url: "https://example.test/about", text: page('<h1>About</h1>') });

    const r = await deepCrawlWebsite("https://example.test/", { maxPages: 2, maxDepth: 1 });
    expect(r.pages).toHaveLength(2);
    expect(r.pages[0].url).toBe("https://example.test/");
    expect(r.pages[0].pageType).toBe("home");
    expect(r.sitemap.found).toBe(true);
  });

  it("stops when robots blocks the crawler", async () => {
    responses.set("https://blocked.test/robots.txt", { status: 200, url: "https://blocked.test/robots.txt", text: "User-agent: *\nDisallow: /", contentType: "text/plain" });
    responses.set("https://blocked.test/sitemap.xml", { status: 404, url: "https://blocked.test/sitemap.xml", text: "no" });
    responses.set("https://blocked.test/llms.txt", { status: 404, url: "https://blocked.test/llms.txt", text: "no" });
    const r = await deepCrawlWebsite("https://blocked.test/");
    expect(r.pages).toHaveLength(0);
    expect(r.issues[0].code).toBe("ROBOTS_BLOCKED");
  });

  it("flags thin content, missing canonical, malformed JSON-LD and entity gaps", async () => {
    responses.set("https://audit.test/robots.txt", { status: 404, url: "https://audit.test/robots.txt", text: "" });
    responses.set("https://audit.test/sitemap.xml", { status: 404, url: "https://audit.test/sitemap.xml", text: "" });
    responses.set("https://audit.test/llms.txt", { status: 404, url: "https://audit.test/llms.txt", text: "" });
    responses.set("https://audit.test/", { status: 200, url: "https://audit.test/", text: '<html><head><title>X</title><script type="application/ld+json">{bad</script></head><body><p>tiny</p></body></html>' });
    const r = await deepCrawlWebsite("https://audit.test/", { maxPages: 1 });
    const codes = r.pages[0].issues.map(i => i.code);
    expect(codes).toEqual(expect.arrayContaining(["MISSING_META_DESCRIPTION","MISSING_CANONICAL","MALFORMED_JSONLD","THIN_CONTENT","MISSING_ENTITY_SCHEMA","MISSING_HTML_LANG"]));
  });

  it("records HTTP errors and does not follow external links", async () => {
    responses.set("https://errors.test/robots.txt", { status: 404, url: "https://errors.test/robots.txt", text: "" });
    responses.set("https://errors.test/sitemap.xml", { status: 404, url: "https://errors.test/sitemap.xml", text: "" });
    responses.set("https://errors.test/llms.txt", { status: 404, url: "https://errors.test/llms.txt", text: "" });
    responses.set("https://errors.test/", { status: 200, url: "https://errors.test/", text: page('<h1>Home</h1><a href="/missing">Missing</a><a href="https://evil.test/">External</a>') });
    responses.set("https://errors.test/missing", { status: 404, url: "https://errors.test/missing", text: page("missing") });
    const r = await deepCrawlWebsite("https://errors.test/", { maxPages: 2, maxDepth: 1 });
    expect(r.pages.some(p => p.statusCode === 404)).toBe(true);
    expect(r.pages[0].issues.some(i => i.code === "BROKEN_INTERNAL_LINK")).toBe(true);
    expect(r.pages.some(p => p.url.includes("evil.test"))).toBe(false);
  });
});
