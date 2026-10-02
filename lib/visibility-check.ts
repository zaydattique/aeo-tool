/**
 * Visibility check across answer engines.
 *
 * Live (when keys set):
 * - PERPLEXITY_API_KEY → perplexity (citations when returned)
 * - OPENAI_API_KEY → chatgpt
 * - GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY → gemini
 * - ANTHROPIC_API_KEY → claude
 *
 * Heuristics always fill any engine without a live response so the UI is never empty.
 * Competitor-aware scoring for kind=competitor prompts.
 */

import { withProviderCache } from "./visibility-cache";

export type EngineResult = {
  engine: string;
  score: number;
  mentioned: boolean;
  competitorMentioned?: boolean;
  snippet?: string;
  citations?: string[];
  live: boolean;
  cacheHit?: boolean;
};

export type PromptCheckResult = {
  promptText: string;
  score: number;
  engines: EngineResult[];
  method: "live" | "live+heuristic" | "heuristic";
  brandMentioned: boolean;
  competitorMentioned: boolean;
  liveEngineCount: number;
  freshLiveEngineCount: number;
};

export type LiveEngineCapability = {
  engine: string;
  configured: boolean;
  envVar: string;
};

const USER_PROMPT_SUFFIX =
  "\n\n(Answer briefly in under 120 words. Name relevant brands if they apply.)";

function hashScore(seed: string, base: number, spread: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const delta = (h % (spread * 2 + 1)) - spread;
  return Math.max(0, Math.min(100, Math.round(base + delta)));
}

function tokens(name: string) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function mentions(text: string, name: string) {
  const lower = text.toLowerCase();
  return tokens(name).some((t) => lower.includes(t));
}

function scoreFromText(
  content: string,
  brandName: string,
  competitorName?: string | null,
  citations: string[] = []
): Omit<EngineResult, "engine" | "live" | "snippet"> & { snippet: string } {
  const brandMentioned = mentions(content, brandName);
  const competitorMentioned = competitorName
    ? mentions(content, competitorName)
    : false;

  let score = brandMentioned ? 72 : 28;
  if (brandMentioned && citations.length > 0) score = Math.min(100, score + 12);
  if (!brandMentioned && citations.length > 0) score = Math.min(55, score + 8);
  if (competitorMentioned && !brandMentioned) score = Math.max(15, score - 15);
  if (competitorMentioned && brandMentioned) score = Math.min(100, score + 5);

  return {
    score,
    mentioned: brandMentioned,
    competitorMentioned,
    citations: citations.slice(0, 5),
    snippet: content.slice(0, 280),
  };
}

function heuristicEngines(opts: {
  promptText: string;
  brandName: string;
  base: number;
  competitorName?: string | null;
  kind?: string;
}): EngineResult[] {
  const { promptText, brandName, base, competitorName, kind } = opts;
  const brandInPrompt = mentions(promptText, brandName);
  const compInPrompt = competitorName
    ? mentions(promptText, competitorName)
    : false;

  const mk = (engine: string, spread: number, bias: number): EngineResult => {
    let score = hashScore(`${engine}:${promptText}`, base + bias, spread);
    if (kind === "competitor" && competitorName) {
      const p = promptText.toLowerCase();
      const cIdx = p.indexOf(competitorName.toLowerCase().split(" ")[0] || "");
      const bIdx = p.indexOf(brandName.toLowerCase().split(" ")[0] || "");
      if (cIdx >= 0 && (bIdx < 0 || cIdx < bIdx)) score = Math.max(0, score - 8);
    }
    return {
      engine,
      score,
      mentioned: brandInPrompt && score >= 45,
      competitorMentioned: compInPrompt && score >= 40,
      live: false,
      snippet: `Heuristic estimate ${score}/100 (no live key for ${engine}).`,
    };
  };

  return [
    mk("chatgpt", 12, 0),
    mk("perplexity", 10, brandInPrompt ? 5 : -3),
    mk("gemini", 11, -2),
    mk("claude", 11, -1),
    mk("ai_overviews", 14, -5),
  ];
}

/** Which live providers are configured (no secrets exposed). */
export function getLiveEngineCapabilities(): LiveEngineCapability[] {
  return [
    {
      engine: "perplexity",
      configured: Boolean(process.env.PERPLEXITY_API_KEY),
      envVar: "PERPLEXITY_API_KEY",
    },
    {
      engine: "chatgpt",
      configured: Boolean(process.env.OPENAI_API_KEY),
      envVar: "OPENAI_API_KEY",
    },
    {
      engine: "gemini",
      configured: Boolean(
        process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ),
      envVar: "GEMINI_API_KEY",
    },
    {
      engine: "claude",
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
      envVar: "ANTHROPIC_API_KEY",
    },
  ];
}

async function checkPerplexityLiveUncached(
  promptText: string,
  brandName: string,
  competitorName?: string | null
): Promise<EngineResult | null> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content: `${promptText}${USER_PROMPT_SUFFIX}`,
          },
        ],
        max_tokens: 400,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.warn("[visibility] Perplexity HTTP", res.status);
      return null;
    }

    const json = await res.json();
    const content: string =
      json.choices?.[0]?.message?.content ||
      json.choices?.[0]?.delta?.content ||
      "";
    const citations: string[] = Array.isArray(json.citations)
      ? json.citations.map(String)
      : [];

    const scored = scoreFromText(content, brandName, competitorName, citations);
    return { engine: "perplexity", live: true, ...scored };
  } catch (err) {
    console.warn("[visibility] Perplexity error", err);
    return null;
  }
}


async function checkPerplexityLive(
  promptText: string,
  brandName: string,
  competitorName?: string | null,
  kind?: string
): Promise<EngineResult | null> {
  const model = sonar;
  const cached = await withProviderCache(
    { engine: "perplexity", model, promptText, brandName, competitorName, kind },
    () => checkPerplexityLiveUncached(promptText, brandName, competitorName)
  );
  if (!cached.value) return null;
  return { ...cached.value, cacheHit: cached.cacheHit };
}

async function checkOpenAiLiveUncached(
  promptText: string,
  brandName: string,
  competitorName?: string | null
): Promise<EngineResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISIBILITY_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${promptText}${USER_PROMPT_SUFFIX}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.warn("[visibility] OpenAI HTTP", res.status);
      return null;
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content || "";
    const scored = scoreFromText(content, brandName, competitorName);
    return { engine: "chatgpt", live: true, ...scored };
  } catch (err) {
    console.warn("[visibility] OpenAI error", err);
    return null;
  }
}


async function checkOpenAiLive(
  promptText: string,
  brandName: string,
  competitorName?: string | null,
  kind?: string
): Promise<EngineResult | null> {
  const model = process.env.OPENAI_VISIBILITY_MODEL || "gpt-4o-mini";
  const cached = await withProviderCache(
    { engine: "chatgpt", model, promptText, brandName, competitorName, kind },
    () => checkOpenAiLiveUncached(promptText, brandName, competitorName)
  );
  if (!cached.value) return null;
  return { ...cached.value, cacheHit: cached.cacheHit };
}

async function checkGeminiLiveUncached(
  promptText: string,
  brandName: string,
  competitorName?: string | null
): Promise<EngineResult | null> {
  const key =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_VISIBILITY_MODEL || "gemini-2.0-flash";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${promptText}${USER_PROMPT_SUFFIX}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.2,
          },
        }),
      }
    );

    if (!res.ok) {
      console.warn("[visibility] Gemini HTTP", res.status);
      return null;
    }

    const json = await res.json();
    const content: string =
      json.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("") || "";
    const scored = scoreFromText(content, brandName, competitorName);
    return { engine: "gemini", live: true, ...scored };
  } catch (err) {
    console.warn("[visibility] Gemini error", err);
    return null;
  }
}


async function checkGeminiLive(
  promptText: string,
  brandName: string,
  competitorName?: string | null,
  kind?: string
): Promise<EngineResult | null> {
  const model = process.env.GEMINI_VISIBILITY_MODEL || "gemini-2.0-flash";
  const cached = await withProviderCache(
    { engine: "gemini", model, promptText, brandName, competitorName, kind },
    () => checkGeminiLiveUncached(promptText, brandName, competitorName)
  );
  if (!cached.value) return null;
  return { ...cached.value, cacheHit: cached.cacheHit };
}

async function checkClaudeLiveUncached(
  promptText: string,
  brandName: string,
  competitorName?: string | null
): Promise<EngineResult | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_VISIBILITY_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `${promptText}${USER_PROMPT_SUFFIX}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.warn("[visibility] Claude HTTP", res.status);
      return null;
    }

    const json = await res.json();
    const content: string = Array.isArray(json.content)
      ? json.content.map((c: { text?: string }) => c.text || "").join("")
      : "";
    const scored = scoreFromText(content, brandName, competitorName);
    return { engine: "claude", live: true, ...scored };
  } catch (err) {
    console.warn("[visibility] Claude error", err);
    return null;
  }
}


async function checkClaudeLive(
  promptText: string,
  brandName: string,
  competitorName?: string | null,
  kind?: string
): Promise<EngineResult | null> {
  const model = process.env.ANTHROPIC_VISIBILITY_MODEL || "claude-3-5-haiku-latest";
  const cached = await withProviderCache(
    { engine: "claude", model, promptText, brandName, competitorName, kind },
    () => checkClaudeLiveUncached(promptText, brandName, competitorName)
  );
  if (!cached.value) return null;
  return { ...cached.value, cacheHit: cached.cacheHit };
}

export async function checkPromptVisibility(opts: {
  promptText: string;
  brandName: string;
  baseScore: number;
  kind?: string;
  competitorName?: string | null;
}): Promise<PromptCheckResult> {
  const {
    promptText,
    brandName,
    baseScore,
    kind = "brand",
    competitorName,
  } = opts;

  const engines = heuristicEngines({
    promptText,
    brandName,
    base: baseScore,
    competitorName,
    kind,
  });

  const liveResults = await Promise.all([
    checkPerplexityLive(promptText, brandName, competitorName, kind),
    checkOpenAiLive(promptText, brandName, competitorName, kind),
    checkGeminiLive(promptText, brandName, competitorName, kind),
    checkClaudeLive(promptText, brandName, competitorName, kind),
  ]);

  let liveEngineCount = 0;
  let freshLiveEngineCount = 0;
  for (const live of liveResults) {
    if (!live) continue;
    liveEngineCount += 1;
    if (!live.cacheHit) freshLiveEngineCount += 1;
    const idx = engines.findIndex((e) => e.engine === live.engine);
    if (idx >= 0) engines[idx] = live;
    else engines.push(live);
  }

  // ai_overviews stays heuristic-only (no public consumer API)
  const method: PromptCheckResult["method"] =
    liveEngineCount === 0
      ? "heuristic"
      : liveEngineCount >= 3
        ? "live"
        : "live+heuristic";

  const score = Math.round(
    engines.reduce((s, e) => s + e.score, 0) / Math.max(1, engines.length)
  );

  const brandMentioned = engines.some((e) => e.mentioned);
  const competitorMentioned = engines.some((e) => e.competitorMentioned);

  return {
    promptText,
    score,
    engines,
    method,
    brandMentioned,
    competitorMentioned,
    liveEngineCount,
    freshLiveEngineCount,
  };
}
