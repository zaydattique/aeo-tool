/**
 * Website crawl service.
 * Primary: Firecrawl API (when FIRECRAWL_API_KEY is set)
 * Fallback: SSRF-safe basic fetch + lightweight HTML signal extraction
 */

import { safeFetch } from "./safe-fetch";
import { validateWebsiteUrl } from "./url";

export type CrawlResult = {
  url: string;
  title: string | null;
  description: string | null;
  markdown: string | null;
  html: string | null;
  links: string[];
  metadata: Record<string, unknown>;
  signals: ExtractedSignals;
  provider: "firecrawl" | "basic";
  durationMs: number;
};

export type ExtractedSignals = {
  hasTitle: boolean;
  titleLength: number;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  hasJsonLd: boolean;
  jsonLdTypes: string[];
  hasFaqSchema: boolean;
  hasOrgSchema: boolean;
  hasArticleSchema: boolean;
  hasLlmsTxtLink: boolean;
  imageCount: number;
  imagesWithAlt: number;
  internalLinkCount: number;
  externalLinkCount: number;
  hasViewport: boolean;
  hasLang: boolean;
  contentPreview: string;
};

function extractSignals(html: string, url: string): ExtractedSignals {
  const lower = html.toLowerCase();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || "";

  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i
    ) ||
    html.match(
      /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i
    );
  const description = descMatch?.[1]?.trim() || "";

  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (html.match(/<h3[\s>]/gi) || []).length;

  const textContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  const hasCanonical = /rel=["']canonical["']/i.test(html);
  const hasOpenGraph = /property=["']og:/i.test(html);
  const hasTwitterCard = /name=["']twitter:/i.test(html);

  const jsonLdBlocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  const jsonLdTypes: string[] = [];
  let hasFaqSchema = false;
  let hasOrgSchema = false;
  let hasArticleSchema = false;

  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const t = item["@type"];
        if (typeof t === "string") {
          jsonLdTypes.push(t);
          if (t === "FAQPage") hasFaqSchema = true;
          if (t === "Organization" || t === "LocalBusiness") hasOrgSchema = true;
          if (t === "Article" || t === "BlogPosting" || t === "NewsArticle")
            hasArticleSchema = true;
        } else if (Array.isArray(t)) {
          jsonLdTypes.push(...t);
        }
        if (Array.isArray(item["@graph"])) {
          for (const g of item["@graph"]) {
            if (typeof g["@type"] === "string") {
              jsonLdTypes.push(g["@type"]);
              if (g["@type"] === "FAQPage") hasFaqSchema = true;
              if (
                g["@type"] === "Organization" ||
                g["@type"] === "LocalBusiness"
              )
                hasOrgSchema = true;
            }
          }
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }

  const imgTags = [...html.matchAll(/<img[^>]*>/gi)];
  const imageCount = imgTags.length;
  const imagesWithAlt = imgTags.filter((m) =>
    /alt=["'][^"']+["']/i.test(m[0])
  ).length;

  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* ignore */
  }

  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]);
  let internalLinkCount = 0;
  let externalLinkCount = 0;
  for (const href of hrefs) {
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    )
      continue;
    try {
      const abs = new URL(href, url);
      if (abs.hostname === host) internalLinkCount++;
      else externalLinkCount++;
    } catch {
      /* ignore */
    }
  }

  const hasLlmsTxtLink = /llms\.txt/i.test(html);
  const hasViewport = /name=["']viewport["']/i.test(lower);
  const hasLang = /<html[^>]+lang=/i.test(html);

  return {
    hasTitle: title.length > 0,
    titleLength: title.length,
    hasMetaDescription: description.length > 0,
    metaDescriptionLength: description.length,
    h1Count,
    h2Count,
    h3Count,
    wordCount,
    hasCanonical,
    hasOpenGraph,
    hasTwitterCard,
    hasJsonLd: jsonLdBlocks.length > 0,
    jsonLdTypes: [...new Set(jsonLdTypes)],
    hasFaqSchema,
    hasOrgSchema,
    hasArticleSchema,
    hasLlmsTxtLink,
    imageCount,
    imagesWithAlt,
    internalLinkCount,
    externalLinkCount,
    hasViewport,
    hasLang,
    contentPreview: textContent.slice(0, 2000),
  };
}

async function crawlWithFirecrawl(url: string): Promise<CrawlResult> {
  const start = Date.now();
  // Defense in depth: never send an unvalidated URL to a third party
  const v = validateWebsiteUrl(url);
  if (!v.ok) throw new Error(v.error);
  const apiKey = process.env.FIRECRAWL_API_KEY!;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      url: v.url,
      formats: ["markdown", "html"],
      onlyMainContent: false,
      timeout: 30000,
    }),
  });
  clearTimeout(timeout);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firecrawl error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const data = json.data || json;

  const html: string = data.html || "";
  const markdown: string = data.markdown || "";
  const metadata = data.metadata || {};

  const signals = extractSignals(html || markdown, v.url);

  return {
    url: v.url,
    title: metadata.title || null,
    description: metadata.description || null,
    markdown: markdown || null,
    html: html ? html.slice(0, 500000) : null,
    links: data.links || [],
    metadata,
    signals,
    provider: "firecrawl",
    durationMs: Date.now() - start,
  };
}

async function crawlBasic(url: string): Promise<CrawlResult> {
  const start = Date.now();

  const res = await safeFetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${url}`);
  }

  const html = await res.text();
  if (Buffer.byteLength(html, "utf8") > 5 * 1024 * 1024) {
    throw new Error("Basic crawl response exceeded 5MB");
  }
  const signals = extractSignals(html, url);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i
    ) ||
    html.match(
      /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i
    );

  return {
    url: res.url || url,
    title: titleMatch?.[1]?.trim() || null,
    description: descMatch?.[1]?.trim() || null,
    markdown: null,
    html: html.slice(0, 500000),
    links: [],
    metadata: {},
    signals,
    provider: "basic",
    durationMs: Date.now() - start,
  };
}

export async function crawlWebsite(url: string): Promise<CrawlResult> {
  const v = validateWebsiteUrl(url);
  if (!v.ok) {
    throw new Error(v.error);
  }
  url = v.url;

  if (process.env.FIRECRAWL_API_KEY) {
    try {
      return await crawlWithFirecrawl(url);
    } catch (err) {
      console.warn(
        "[crawl] Firecrawl failed, falling back to basic:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return crawlBasic(url);
}
