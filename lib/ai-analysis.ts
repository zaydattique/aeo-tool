/**
 * AEO AI analysis service.
 * Primary: Anthropic Claude (when ANTHROPIC_API_KEY is set)
 * Fallback: deterministic heuristic scoring from crawl signals
 */

import type { CrawlResult } from "./crawl";

export type AeoIssue = {
  category:
    | "TECHNICAL"
    | "CONTENT"
    | "SCHEMA"
    | "ENTITY"
    | "AUTHORITY"
    | "PERFORMANCE"
    | "OTHER";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  whyItMatters: string;
  effort: "LOW" | "MEDIUM" | "HIGH";
  suggestedFix: string;
};

export type AiAnalysisResult = {
  visibilityScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  issues: AeoIssue[];
  scores: {
    technical: number;
    content: number;
    schema: number;
    entity: number;
  };
  provider: "anthropic" | "heuristic";
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
};

function heuristicAnalysis(crawl: CrawlResult): AiAnalysisResult {
  const start = Date.now();
  const s = crawl.signals;
  const issues: AeoIssue[] = [];

  // Technical
  if (!s.hasTitle || s.titleLength < 10) {
    issues.push({
      category: "TECHNICAL",
      priority: "HIGH",
      title: "Missing or weak page title",
      whyItMatters:
        "AI engines and search use the title as a primary entity signal.",
      effort: "LOW",
      suggestedFix:
        "Add a clear, descriptive <title> of 30–60 characters that includes the primary brand/topic.",
    });
  }
  if (!s.hasMetaDescription || s.metaDescriptionLength < 50) {
    issues.push({
      category: "CONTENT",
      priority: "HIGH",
      title: "Missing or short meta description",
      whyItMatters:
        "Meta descriptions help AI systems summarize what the page is about.",
      effort: "LOW",
      suggestedFix:
        "Write a 120–160 character meta description that answers the main user intent.",
    });
  }
  if (s.h1Count === 0) {
    issues.push({
      category: "CONTENT",
      priority: "HIGH",
      title: "No H1 heading found",
      whyItMatters: "H1 is a core structural signal for topic understanding.",
      effort: "LOW",
      suggestedFix: "Add a single clear H1 that states the primary topic.",
    });
  } else if (s.h1Count > 1) {
    issues.push({
      category: "CONTENT",
      priority: "MEDIUM",
      title: "Multiple H1 headings",
      whyItMatters: "Multiple H1s dilute topical focus for AI parsers.",
      effort: "LOW",
      suggestedFix: "Keep one H1; demote others to H2.",
    });
  }
  if (!s.hasCanonical) {
    issues.push({
      category: "TECHNICAL",
      priority: "MEDIUM",
      title: "No canonical URL",
      whyItMatters: "Canonicals prevent duplicate entity confusion.",
      effort: "LOW",
      suggestedFix: "Add <link rel=\"canonical\" href=\"...\"> pointing to the preferred URL.",
    });
  }
  if (!s.hasViewport) {
    issues.push({
      category: "TECHNICAL",
      priority: "MEDIUM",
      title: "Missing viewport meta",
      whyItMatters: "Mobile usability affects overall quality signals.",
      effort: "LOW",
      suggestedFix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
    });
  }

  // Schema / entity
  if (!s.hasJsonLd) {
    issues.push({
      category: "SCHEMA",
      priority: "HIGH",
      title: "No JSON-LD structured data",
      whyItMatters:
        "Schema.org markup is one of the strongest signals for AI citation eligibility.",
      effort: "MEDIUM",
      suggestedFix:
        "Add JSON-LD for Organization and the primary page type (Article, FAQPage, Product, etc.).",
    });
  } else {
    if (!s.hasOrgSchema) {
      issues.push({
        category: "ENTITY",
        priority: "MEDIUM",
        title: "No Organization schema",
        whyItMatters: "Entity clarity helps AI engines attribute answers to your brand.",
        effort: "MEDIUM",
        suggestedFix:
          "Add Organization (or LocalBusiness) JSON-LD with name, url, logo, sameAs.",
      });
    }
    if (!s.hasFaqSchema && s.wordCount > 300) {
      issues.push({
        category: "SCHEMA",
        priority: "MEDIUM",
        title: "No FAQ schema",
        whyItMatters:
          "FAQPage schema increases chance of being cited in AI answers for question queries.",
        effort: "MEDIUM",
        suggestedFix:
          "Add an FAQ section with real questions and mark it up as FAQPage JSON-LD.",
      });
    }
  }

  if (!s.hasLlmsTxtLink) {
    issues.push({
      category: "TECHNICAL",
      priority: "LOW",
      title: "No llms.txt reference",
      whyItMatters:
        "llms.txt is an emerging standard for guiding AI crawlers to key content.",
      effort: "LOW",
      suggestedFix:
        "Publish /llms.txt summarizing your site for AI agents and link it from the homepage.",
    });
  }

  if (s.wordCount < 200) {
    issues.push({
      category: "CONTENT",
      priority: "HIGH",
      title: "Thin content",
      whyItMatters:
        "AI engines prefer substantive, answer-rich pages for citations.",
      effort: "HIGH",
      suggestedFix:
        "Expand primary content to 600+ words with clear answers, examples, and structure.",
    });
  }

  if (s.imageCount > 0 && s.imagesWithAlt / s.imageCount < 0.5) {
    issues.push({
      category: "CONTENT",
      priority: "LOW",
      title: "Many images missing alt text",
      whyItMatters: "Alt text improves accessibility and multimodal understanding.",
      effort: "MEDIUM",
      suggestedFix: "Add descriptive alt attributes to all meaningful images.",
    });
  }

  if (!s.hasOpenGraph) {
    issues.push({
      category: "TECHNICAL",
      priority: "LOW",
      title: "Missing Open Graph tags",
      whyItMatters: "OG tags improve share previews and secondary entity signals.",
      effort: "LOW",
      suggestedFix: "Add og:title, og:description, og:image, og:url.",
    });
  }

  // Scores
  let technical = 70;
  let content = 70;
  let schema = 50;
  let entity = 50;

  if (s.hasTitle && s.titleLength >= 20) technical += 5;
  if (s.hasCanonical) technical += 5;
  if (s.hasViewport) technical += 5;
  if (s.hasLang) technical += 5;
  if (!s.hasTitle) technical -= 20;

  if (s.hasMetaDescription && s.metaDescriptionLength >= 80) content += 10;
  if (s.h1Count === 1) content += 10;
  if (s.wordCount >= 600) content += 10;
  if (s.wordCount < 200) content -= 25;
  if (s.h2Count >= 2) content += 5;

  if (s.hasJsonLd) schema += 25;
  if (s.hasFaqSchema) schema += 15;
  if (s.hasArticleSchema) schema += 10;

  if (s.hasOrgSchema) entity += 25;
  if (s.hasOpenGraph) entity += 10;
  if (s.hasLlmsTxtLink) entity += 10;

  technical = Math.max(0, Math.min(100, technical));
  content = Math.max(0, Math.min(100, content));
  schema = Math.max(0, Math.min(100, schema));
  entity = Math.max(0, Math.min(100, entity));

  const visibilityScore = Math.round(
    technical * 0.25 + content * 0.3 + schema * 0.25 + entity * 0.2
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (s.hasJsonLd) strengths.push("Has structured data (JSON-LD)");
  if (s.h1Count === 1) strengths.push("Clear single H1");
  if (s.wordCount >= 600) strengths.push("Substantial content depth");
  if (s.hasOrgSchema) strengths.push("Organization entity markup present");
  if (s.hasFaqSchema) strengths.push("FAQ schema present");

  if (!s.hasJsonLd) weaknesses.push("No structured data");
  if (s.wordCount < 300) weaknesses.push("Thin content");
  if (!s.hasMetaDescription) weaknesses.push("No meta description");
  if (!s.hasOrgSchema) weaknesses.push("Weak entity signals");

  return {
    visibilityScore,
    summary: `Heuristic AEO scan of ${crawl.url}. Score ${visibilityScore}/100 based on technical, content, schema, and entity signals. ${issues.length} issues identified.`,
    strengths,
    weaknesses,
    issues,
    scores: { technical, content, schema, entity },
    provider: "heuristic",
    model: null,
    inputTokens: null,
    outputTokens: null,
    durationMs: Date.now() - start,
  };
}

async function analyzeWithClaude(
  crawl: CrawlResult,
  brandName?: string | null
): Promise<AiAnalysisResult> {
  const start = Date.now();
  const timeoutMs = Math.max(
    5_000,
    Math.min(60_000, Number.parseInt(process.env.AI_PROVIDER_TIMEOUT_MS || "30_000", 10) || 30_000)
  );
  const maxResponseBytes = Math.max(
    64 * 1024,
    Math.min(2 * 1024 * 1024, Number.parseInt(process.env.AI_PROVIDER_MAX_RESPONSE_BYTES || "1048576", 10) || 1048576)
  );
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  const signalsJson = JSON.stringify(crawl.signals, null, 0);
  const contentSnippet = (
    crawl.markdown ||
    crawl.signals.contentPreview ||
    ""
  ).slice(0, 6000);

  const system = `You are an Answer Engine Optimization (AEO / GEO) expert. Analyze websites for how well they can be understood and cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Claude, Gemini).

Respond ONLY with valid JSON matching this schema (no markdown fences):
{
  "visibilityScore": number 0-100,
  "summary": string (2-3 sentences),
  "strengths": string[],
  "weaknesses": string[],
  "scores": { "technical": 0-100, "content": 0-100, "schema": 0-100, "entity": 0-100 },
  "issues": [
    {
      "category": "TECHNICAL"|"CONTENT"|"SCHEMA"|"ENTITY"|"AUTHORITY"|"PERFORMANCE"|"OTHER",
      "priority": "HIGH"|"MEDIUM"|"LOW",
      "title": string,
      "whyItMatters": string,
      "effort": "LOW"|"MEDIUM"|"HIGH",
      "suggestedFix": string
    }
  ]
}

Prioritize issues that most affect AI citation likelihood. Be specific and actionable. Max 12 issues.`;

  const user = `Analyze this page for AEO readiness.

URL: ${crawl.url}
Brand: ${brandName || crawl.title || "unknown"}
Title: ${crawl.title || "(none)"}
Meta description: ${crawl.description || "(none)"}
Crawl provider: ${crawl.provider}

Extracted signals:
${signalsJson}

Content excerpt:
${contentSnippet}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: user }],
    }),
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic error ${res.status}: ${text.slice(0, 300)}`);
  }

  const responseText = await res.text();
  if (Buffer.byteLength(responseText, "utf8") > maxResponseBytes) {
    throw new Error("Anthropic response exceeded configured size limit");
  }

  let json: {
    content?: Array<{ type: string; text?: string }>;
    model?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error("Invalid Anthropic JSON response");
  }

  const textBlock = json.content?.find(
    (b: { type: string }) => b.type === "text"
  );
  const raw: string = textBlock?.text || "";

  // Parse JSON from response (handle accidental fences)
  let parsed: Record<string, unknown>;
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse Claude JSON response");
  }

  const issues = Array.isArray(parsed.issues)
    ? (parsed.issues as AeoIssue[]).slice(0, 12).map((issue) => ({
        ...issue,
        title: String(issue.title || "").slice(0, 500),
        whyItMatters: String(issue.whyItMatters || "").slice(0, 2_000),
        suggestedFix: String(issue.suggestedFix || "").slice(0, 8_000),
      }))
    : [];

  const scores = (parsed.scores as AiAnalysisResult["scores"]) || {
    technical: 50,
    content: 50,
    schema: 50,
    entity: 50,
  };

  return {
    visibilityScore: Math.max(
      0,
      Math.min(100, Number(parsed.visibilityScore) || 50)
    ),
    summary: String(parsed.summary || "Analysis complete."),
    strengths: Array.isArray(parsed.strengths)
      ? (parsed.strengths as string[])
      : [],
    weaknesses: Array.isArray(parsed.weaknesses)
      ? (parsed.weaknesses as string[])
      : [],
    issues,
    scores,
    provider: "anthropic",
    model: json.model || "claude-sonnet-4-20250514",
    inputTokens: json.usage?.input_tokens ?? null,
    outputTokens: json.usage?.output_tokens ?? null,
    durationMs: Date.now() - start,
  };
}

export async function analyzeForAeo(
  crawl: CrawlResult,
  brandName?: string | null
): Promise<AiAnalysisResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await analyzeWithClaude(crawl, brandName);
    } catch (err) {
      console.warn(
        "[ai-analysis] Claude failed, using heuristic:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return heuristicAnalysis(crawl);
}
