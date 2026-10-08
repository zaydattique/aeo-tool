import { createHash } from "node:crypto";
import { safeFetch } from "./safe-fetch";
import { validateWebsiteUrl } from "./url";

export type CrawlConfig = {
  maxPages?: number;
  maxDepth?: number;
  maxDurationMs?: number;
};

export type CrawlPageResult = {
  url: string;
  finalUrl: string;
  depth: number;
  statusCode: number;
  responseMs: number;
  responseBytes: number;
  contentType: string;
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  h1Count: number;
  h2Count: number;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  indexable: boolean;
  robotsNoindex: boolean;
  pageType: string;
  duplicateHash: string;
  structuredData: Record<string, unknown>;
  entitySignals: Record<string, unknown>;
  contentSignals: Record<string, unknown>;
  technicalSignals: Record<string, unknown>;
  links: string[];
  issues: Array<{ code: string; severity: string; title: string; evidence: Record<string, unknown> }>;
};

export type DeepCrawlResult = {
  startUrl: string;
  pages: CrawlPageResult[];
  issues: CrawlPageResult["issues"];
  robots: { fetched: boolean; allowed: boolean; content: string | null };
  sitemap: { found: boolean; urls: string[] };
  llmsTxt: { found: boolean };
  durationMs: number;
  truncated: boolean;
};

const VERSION = "5.0";
const DEFAULT_MAX_PAGES = 100;
const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_MAX_DURATION = 90_000;

function intEnv(name: string, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function config(): Required<CrawlConfig> {
  return {
    maxPages: intEnv("CRAWL_MAX_PAGES", DEFAULT_MAX_PAGES, 1, 500),
    maxDepth: intEnv("CRAWL_MAX_DEPTH", DEFAULT_MAX_DEPTH, 0, 10),
    maxDurationMs: intEnv("CRAWL_MAX_DURATION_MS", DEFAULT_MAX_DURATION, 5_000, 300_000),
  };
}
function stripHtml(s: string): string {
  return s.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/\s+/g," ").trim();
}
function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(name + "\\s*=\\s*[\\\"']([^\\\"']*)[\\\"']", "i"));
  return m?.[1]?.trim() || null;
}
function linksFrom(html: string, base: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<a[^>]+href\s*=\s*[\"']([^\"']+)[\"']/gi)) {
    try {
      const u = new URL(m[1], base);
      if (u.protocol !== "http:" && u.protocol !== "https:") continue;
      u.hash = "";
      out.push(u.toString());
    } catch {}
  }
  return [...new Set(out)];
}
function pageType(path: string, html: string): string {
  const p = path.toLowerCase();
  if (/\/blog\/?|\/news\/?|\/article\/?/.test(p) || /@type[\"']?\s*:\s*[\"'](?:Article|BlogPosting)/i.test(html)) return "article";
  if (/\/product(?:s)?\//.test(p) || /Product/i.test(html.match(/application\/ld\+json[\s\S]*?<\/script>/i)?.[0] || "")) return "product";
  if (/\/service(?:s)?\//.test(p)) return "service";
  if (/contact/.test(p)) return "contact";
  if (/about/.test(p)) return "about";
  if (/\/category\/|\/tag\//.test(p)) return "listing";
  return p === "/" || p === "" ? "home" : "general";
}
function parseRobots(text: string, host: string): boolean {
  let applies = false, allowed = true;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (key.toLowerCase() === "user-agent") applies = value === "*" || value.toLowerCase().includes("aeocommandbot") || value.toLowerCase().includes("googlebot");
    if (applies && key.toLowerCase() === "disallow" && value === "/") allowed = false;
  }
  return allowed;
}
function issue(code: string,severity: string,title: string,evidence: Record<string,unknown>={}){
  return {code,severity,title,evidence};
}
function extractStructured(html: string) {
  const types = new Set<string>(); let valid = 0; let malformed = 0;
  for(const m of html.matchAll(/<script[^>]+type=[\"']application\/ld\+json[\"'][^>]*>([\s\S]*?)<\/script>/gi)){
    try {
      const data=JSON.parse(m[1]); valid++;
      const items=Array.isArray(data)?data:[data];
      for(const item of items){ if(typeof item?.["@type"]==="string") types.add(item["@type"]); for(const g of item?.["@graph"]||[]) if(typeof g?.["@type"]==="string") types.add(g["@type"]); }
    } catch { malformed++; }
  }
  return {types:[...types],validBlocks:valid,malformedBlocks:malformed};
}
function entitySignals(html:string, baseUrl:string, structured:Record<string,unknown>) {
  const types=(structured.types as string[])||[];
  const text=stripHtml(html).slice(0,20000);
  return {
    organization: types.some(t=>t==="Organization"||t==="LocalBusiness"),
    localBusiness: types.includes("LocalBusiness"),
    product: types.includes("Product"),
    author: /(?:\"author\"|itemprop=[\"']author|rel=[\"']author)/i.test(html),
    publisher: /(?:\"publisher\"|itemprop=[\"']publisher)/i.test(html),
    sameAs: /\"sameAs\"\s*:/i.test(html),
    ogSiteName: /property=[\"']og:site_name/i.test(html),
    brandTokens: text.length > 100,
    host: new URL(baseUrl).hostname,
  };
}
function contentSignals(html:string, wordCount:number) {
  const text=stripHtml(html);
  const questions=(text.match(/\?/g)||[]).length;
  const freshness=/datePublished|dateModified|article:published_time|article:modified_time/i.test(html);
  return {
    depth: wordCount >= 1500 ? "deep" : wordCount >= 600 ? "medium" : "thin",
    questionAnswerCoverage: Math.min(100, questions * 5),
    citationWorthiness: wordCount >= 800 && /source|reference|according to/i.test(text) ? "high" : wordCount >= 400 ? "medium" : "low",
    freshnessSignal: freshness,
    textHash: createHash("sha256").update(text.toLowerCase().replace(/\s+/g," ").trim()).digest("hex"),
  };
}

export async function deepCrawlWebsite(startUrl:string, overrides:CrawlConfig={}):Promise<DeepCrawlResult>{
  const v=validateWebsiteUrl(startUrl); if(!v.ok) throw new Error(v.error);
  const cfg={...config(),...overrides}; const started=Date.now();
  const root=new URL(v.url); root.hash="";
  const queue:Array<{url:string;depth:number}>=[{url:root.toString(),depth:0}];
  const seen=new Set<string>(); const pages:CrawlPageResult[]=[]; const allIssues:CrawlPageResult["issues"]=[];
  const origin=root.origin;
  let robotsContent:string|null=null, robotsAllowed=true;
  try { const r=await safeFetch(new URL("/robots.txt",origin).toString(),{timeoutMs:8000}); robotsContent=await r.text(); robotsAllowed=parseRobots(robotsContent,root.hostname); } catch {}
  const sitemapUrls:string[]=[];
  try {
    const r=await safeFetch(new URL("/sitemap.xml",origin).toString(),{timeoutMs:8000});
    if(r.ok){ const xml=await r.text(); for(const m of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)) sitemapUrls.push(m[1].trim()); }
  } catch {}
  let llmsFound=false;
  try { const r=await safeFetch(new URL("/llms.txt",origin).toString(),{timeoutMs:8000}); llmsFound=r.ok; } catch {}
  if(!robotsAllowed) return {startUrl:root.toString(),pages:[],issues:[issue("ROBOTS_BLOCKED","HIGH","robots.txt blocks the crawler",{url:root.toString()})],robots:{fetched:Boolean(robotsContent),allowed:false,content:robotsContent},sitemap:{found:sitemapUrls.length>0,urls:sitemapUrls.slice(0,5000)},llmsTxt:{found:llmsFound},durationMs:Date.now()-started,truncated:false};

  while(queue.length && pages.length<cfg.maxPages && Date.now()-started<cfg.maxDurationMs){
    const item=queue.shift()!; if(seen.has(item.url)) continue; seen.add(item.url);
    let res:Awaited<ReturnType<typeof safeFetch>>;
    const t=Date.now();
    try { res=await safeFetch(item.url); } catch(e) {
      const p={url:item.url,finalUrl:item.url,depth:item.depth,statusCode:0,responseMs:Date.now()-t,responseBytes:0,contentType:"",title:null,metaDescription:null,canonicalUrl:null,h1Count:0,h2Count:0,wordCount:0,internalLinks:0,externalLinks:0,indexable:false,robotsNoindex:false,pageType:"unknown",duplicateHash:"",structuredData:{},entitySignals:{},contentSignals:{},technicalSignals:{fetchError:e instanceof Error?e.message:"FETCH_FAILED"},links:[],issues:[issue("FETCH_FAILED","HIGH","Page could not be fetched",{error:e instanceof Error?e.message:"FETCH_FAILED"})]}; pages.push(p); allIssues.push(...p.issues); continue;
    }
    const html=await res.text(); const bytes=Buffer.byteLength(html); const headers=res.headers;
    const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||null;
    const desc=attr(html.match(/<meta[^>]*name=[\"']description[\"'][^>]*>/i)?.[0]||"", "content") || attr(html.match(/<meta[^>]*content=[\"'][^\"']*[\"'][^>]*name=[\"']description[\"'][^>]*>/i)?.[0]||"", "content");
    const canonical=attr(html.match(/<link[^>]*rel=[\"']canonical[\"'][^>]*>/i)?.[0]||"", "href");
    const robotsTag=[...html.matchAll(/<meta[^>]+>/gi)].map(m=>m[0]).find(t=>/name=[\"']robots[\"']/i.test(t)); const robotsValue=attr(robotsTag||"","content")||"";
    const noindex=/\bnoindex\b/i.test(robotsValue);
    const h1=(html.match(/<h1[\s>]/gi)||[]).length,h2=(html.match(/<h2[\s>]/gi)||[]).length;
    const text=stripHtml(html), wordCount=text.split(/\s+/).filter(Boolean).length;
    const links=linksFrom(html,res.url); const internal=links.filter(u=>new URL(u).hostname===root.hostname);
    const external=links.filter(u=>new URL(u).hostname!==root.hostname);
    const structured=extractStructured(html); const entities=entitySignals(html,res.url,structured); const content=contentSignals(html,wordCount);
    const issues:CrawlPageResult["issues"]=[];
    if(res.statusCode>=400) issues.push(issue("HTTP_ERROR","HIGH","HTTP error response",{statusCode:res.statusCode}));
    if(!title) issues.push(issue("MISSING_TITLE","HIGH","Missing title",{})); else if(title.length>60) issues.push(issue("TITLE_TOO_LONG","MEDIUM","Title is longer than typical search display",{length:title.length}));
    if(!desc) issues.push(issue("MISSING_META_DESCRIPTION","MEDIUM","Missing meta description",{}));
    if(h1===0) issues.push(issue("MISSING_H1","MEDIUM","No H1 heading found",{})); if(h1>1) issues.push(issue("MULTIPLE_H1","LOW","Multiple H1 headings found",{count:h1}));
    if(!canonical) issues.push(issue("MISSING_CANONICAL","MEDIUM","Missing canonical URL",{}));
    if(noindex) issues.push(issue("NOINDEX","HIGH","Page is explicitly noindex",{}));
    if(structured.malformedBlocks) issues.push(issue("MALFORMED_JSONLD","MEDIUM","Malformed JSON-LD detected",{count:structured.malformedBlocks}));
    if(!structured.types.length) issues.push(issue("NO_STRUCTURED_DATA","MEDIUM","No JSON-LD structured data detected",{}));
    if(wordCount<300) issues.push(issue("THIN_CONTENT","MEDIUM","Low textual content depth",{wordCount}));
    if(!entities.organization && item.depth===0) issues.push(issue("MISSING_ENTITY_SCHEMA","HIGH","Homepage lacks Organization or LocalBusiness structured data",{}));
    if(!html.match(/<html[^>]+lang=/i)) issues.push(issue("MISSING_HTML_LANG","LOW","HTML language attribute is missing",{}));
    if(!html.match(/name=[\"']viewport[\"']/i)) issues.push(issue("MISSING_VIEWPORT","LOW","Viewport metadata is missing",{}));
    if(links.length===0) issues.push(issue("NO_LINKS","LOW","No crawlable links detected",{}));
    const page:CrawlPageResult={url:item.url,finalUrl:res.url,depth:item.depth,statusCode:res.status,responseMs:Date.now()-t,responseBytes:bytes,contentType:headers.get("content-type")||"",title,metaDescription:desc,canonicalUrl:canonical,h1Count:h1,h2Count:h2,wordCount,internalLinks:internal.length,externalLinks:external.length,indexable:res.ok&&!noindex,robotsNoindex:noindex,pageType:pageType(new URL(res.url).pathname,html),duplicateHash:String(content.textHash),structuredData:structured,entitySignals:entities,contentSignals:content,technicalSignals:{redirected:res.url!==item.url,server:headers.get("server"),xRobotsTag:headers.get("x-robots-tag")||null,methodologyVersion:VERSION},links:internal,issues};
    pages.push(page); allIssues.push(...issues);
    if(item.depth<cfg.maxDepth) for(const u of internal){ const clean=new URL(u); clean.hash=""; if(clean.origin===origin&&!seen.has(clean.toString())) queue.push({url:clean.toString(),depth:item.depth+1}); }
  }
  const byHash = new Map<string, CrawlPageResult[]>();
  for (const p of pages) { if (p.duplicateHash) byHash.set(p.duplicateHash, [...(byHash.get(p.duplicateHash) || []), p]); }
  for (const group of byHash.values()) if (group.length > 1) for (const p of group) {
    const i = issue("DUPLICATE_CONTENT_PATTERN","MEDIUM","Multiple crawled pages share the same normalized content hash",{duplicateCount:group.length,hash:p.duplicateHash});
    p.issues.push(i); allIssues.push(i);
  }
  const statusByUrl = new Map(pages.map((p) => [p.url, p.statusCode]));
  for (const p of pages) for (const u of p.links) {
    const status = statusByUrl.get(u);
    if (status !== undefined && status >= 400) {
      const i = issue("BROKEN_INTERNAL_LINK","HIGH","Internal link points to an error page",{target:u,statusCode:status});
      p.issues.push(i); allIssues.push(i);
    }
  }
  if (sitemapUrls.length) {
    const crawled = new Set(pages.map((p) => p.url));
    const missing = sitemapUrls.filter((u) => { try { return new URL(u).origin === origin && !crawled.has(u); } catch { return false; } }).length;
    if (pages[0] && missing > 0) {
      const i = issue("SITEMAP_COVERAGE_GAP","MEDIUM","Sitemap contains URLs not observed in the bounded crawl",{missingUrls:missing,sitemapUrls:sitemapUrls.length});
      pages[0].issues.push(i); allIssues.push(i);
    }
  }
  return {startUrl:root.toString(),pages,issues:allIssues,robots:{fetched:Boolean(robotsContent),allowed:robotsAllowed,content:robotsContent},sitemap:{found:sitemapUrls.length>0,urls:sitemapUrls.slice(0,5000)},llmsTxt:{found:llmsFound},durationMs:Date.now()-started,truncated:queue.length>0};
}
