/**
 * Visibility check across answer engines.
 * - PERPLEXITY_API_KEY: live Perplexity chat completions (citations when returned)
 * - Always also produces structured heuristic engines (chatgpt/gemini/overview-style scores)
 *   derived from client scan score + prompt signals so UI is never empty offline.
 */

export type EngineResult = {
  engine: string;
  score: number;
  mentioned: boolean;
  snippet?: string;
  citations?: string[];
  live: boolean;
};

export type PromptCheckResult = {
  promptText: string;
  score: number;
  engines: EngineResult[];
  method: "live+heuristic" | "heuristic";
};

function hashScore(seed: string, base: number, spread: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const delta = (h % (spread * 2 + 1)) - spread;
  return Math.max(0, Math.min(100, Math.round(base + delta)));
}

function heuristicEngines(
  promptText: string,
  brandName: string,
  base: number
): EngineResult[] {
  const brand = brandName.toLowerCase();
  const prompt = promptText.toLowerCase();
  const brandInPrompt = prompt.includes(brand.split(" ")[0] || brand);

  const mk = (engine: string, spread: number, bias: number): EngineResult => {
    const score = hashScore(`${engine}:${promptText}`, base + bias, spread);
    return {
      engine,
      score,
      mentioned: brandInPrompt && score >= 45,
      live: false,
      snippet: brandInPrompt
        ? `Heuristic: prompt references brand; estimated presence ${score}/100.`
        : `Heuristic: category-style prompt; estimated presence ${score}/100.`,
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
  brandName: string
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
      json.choices?.[0]?.message?.content || json.choices?.[0]?.delta?.content || "";
    const citations: string[] = Array.isArray(json.citations)
      ? json.citations.map(String)
      : [];

    const lower = content.toLowerCase();
    const brandTokens = brandName
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    const mentioned = brandTokens.some((t) => lower.includes(t));

    let score = mentioned ? 72 : 28;
    if (mentioned && citations.length > 0) score = Math.min(100, score + 12);
    if (!mentioned && citations.length > 0) score = Math.min(55, score + 8);

    return {
      engine: "perplexity",
      score,
      mentioned,
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
}): Promise<PromptCheckResult> {
  const { promptText, brandName, baseScore } = opts;
  const engines = heuristicEngines(promptText, brandName, baseScore);

  const live = await checkPerplexityLive(promptText, brandName);
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

  return { promptText, score, engines, method };
}
