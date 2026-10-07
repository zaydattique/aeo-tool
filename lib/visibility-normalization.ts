import { createHash } from "node:crypto";

export type NormalizedCitation = {
  url: string;
  domain: string;
  position: number | null;
  title?: string;
};

export type NormalizedAnswer = {
  engine: string;
  model: string | null;
  state: "LIVE" | "CACHED" | "ESTIMATED";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  answerText: string;
  answerHash: string;
  citations: NormalizedCitation[];
  mentioned: boolean;
  recommended: boolean;
  competitorMentioned: boolean;
  answerPosition: number | null;
  methodologyVersion: string;
};

const METHODOLOGY_VERSION = "4.0";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeDomain(url: string): string {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

export function extractCitations(answerText: string, providerCitations: string[] = []): NormalizedCitation[] {
  const urls = [...providerCitations, ...(answerText.match(/https?:\/\/[^\s)\]>]+/gi) || [])];
  const seen = new Set<string>();
  const citations: NormalizedCitation[] = [];
  for (const raw of urls) {
    const url = raw.replace(/[),.;]+$/, "");
    const domain = safeDomain(url);
    if (!domain || seen.has(url)) continue;
    seen.add(url);
    citations.push({ url, domain, position: citations.length + 1 });
    if (citations.length >= 20) break;
  }
  return citations;
}

function tokenPattern(name: string): RegExp | null {
  const tokens = name.toLowerCase().trim().split(/\s+/).filter((x) => x.length > 2);
  if (!tokens.length) return null;
  return new RegExp(tokens.join("\\s+"), "i");
}

export function normalizeEngineResult(input: {
  engine: string;
  model?: string | null;
  score: number;
  mentioned: boolean;
  competitorMentioned?: boolean;
  snippet?: string;
  citations?: string[];
  live: boolean;
  cacheHit?: boolean;
}, brandName: string, competitorName?: string | null): NormalizedAnswer {
  const answerText = input.snippet || "";
  const brandMatch = tokenPattern(brandName)?.exec(answerText);
  const competitorMatch = competitorName ? tokenPattern(competitorName)?.exec(answerText) : null;
  const mentioned = input.mentioned || Boolean(brandMatch);
  const competitorMentioned = Boolean(input.competitorMentioned || competitorMatch);
  const recommended = mentioned && /\b(recommend|best|top|choose|prefer|ideal|good option|worth considering)\b/i.test(answerText);
  const firstBrand = brandMatch?.index ?? -1;
  const answerPosition = mentioned ? Math.max(1, firstBrand < 0 ? 1 : firstBrand === 0 ? 1 : 2) : null;
  const citations = extractCitations(answerText, input.citations || []);
  const state = input.live ? (input.cacheHit ? "CACHED" : "LIVE") : "ESTIMATED";
  const confidence = state === "LIVE" ? (citations.length || mentioned ? "HIGH" : "MEDIUM") : state === "CACHED" ? "MEDIUM" : "LOW";
  return {
    engine: input.engine, model: input.model || null, state, confidence, answerText,
    answerHash: sha256(answerText), citations, mentioned, recommended, competitorMentioned,
    answerPosition, methodologyVersion: METHODOLOGY_VERSION,
  };
}

export function classifyPrompt(promptText: string): string {
  const p = promptText.toLowerCase();
  if (/\b(vs|versus|compare|alternative|competitor)\b/.test(p)) return "comparison";
  if (/\b(buy|price|pricing|cost|cheap|near me|local)\b/.test(p)) return "buyer_local";
  if (/\b(best|top|recommend|recommended)\b/.test(p)) return "recommendation";
  if (/\b(how|why|what|guide|problem|fix)\b/.test(p)) return "informational";
  if (/\b(service|product|software|tool)\b/.test(p)) return "product_service";
  return "general";
}

export function calculateShareOfVoice(brandMentions: number, competitorMentions: number): number {
  if (brandMentions < 0 || competitorMentions < 0) throw new Error("INVALID_MENTION_COUNTS");
  const total = brandMentions + competitorMentions;
  return total === 0 ? 0 : Number(((brandMentions / total) * 100).toFixed(4));
}

export function calculateVolatility(scores: number[]): number {
  if (scores.length < 2) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (mean === 0) return 0;
  const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
  return Number((Math.sqrt(variance) / mean * 100).toFixed(4));
}
