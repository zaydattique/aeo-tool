/**
 * Visibility check across answer engines.
 * - PERPLEXITY_API_KEY: live Perplexity when available
 * - Heuristics always fill chatgpt/gemini/ai_overviews-style rows
 * - Competitor-aware scoring for kind=competitor prompts
 */

export type EngineResult = {
  engine: string;
  score: number;
  mentioned: boolean;
  competitorMentioned?: boolean;
  snippet?: string;
  citations?: string[];
  live: boolean;
};

export type PromptCheckResult = {
  promptText: string;
  score: number;
  engines: EngineResult[];
  method: "live+heuristic" | "heuristic";
  brandMentioned: boolean;
  competitorMentioned: boolean;
};

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
    // Competitor-oriented prompts: slightly depress client heuristic if competitor named first in text
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
      snippet: brandInPrompt
        ? `Heuristic: prompt references brand; estimated presence ${score}/100.`
        : `Heuristic: estimated presence ${score}/100.`,
    };
  };

  return [
    mk("chatgpt", 12, 0),
    mk("perplexity", 10, brandInPrompt ? 5 : -3),
    mk("gemini", 11, -2),
    mk("ai_overviews", 14, -5),
  ];
}

async function checkPerplexityLive(
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
            content: `${promptText}\n\n(Answer briefly. If relevant brands are mentioned, name them.)`,
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
      engine: "perplexity",
      score,
      mentioned: brandMentioned,
      competitorMentioned,
      snippet: content.slice(0, 280),
      citations: citations.slice(0, 5),
      live: true,
    };
  } catch (err) {
    console.warn("[visibility] Perplexity error", err);
    return null;
  }
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

  const live = await checkPerplexityLive(
    promptText,
    brandName,
    competitorName
  );
  let method: PromptCheckResult["method"] = "heuristic";

  if (live) {
    method = "live+heuristic";
    const idx = engines.findIndex((e) => e.engine === "perplexity");
    if (idx >= 0) engines[idx] = live;
    else engines.unshift(live);
  }

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
  };
}
