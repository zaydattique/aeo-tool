import { describe, expect, it } from "vitest";
import {
  calculateShareOfVoice,
  calculateVolatility,
  classifyPrompt,
  extractCitations,
  normalizeEngineResult,
} from "../visibility-normalization";

describe("phase4 visibility normalization", () => {
  it("extracts and deduplicates provider and inline citations", () => {
    const result = extractCitations(
      "See https://example.com/page and https://example.com/page.",
      ["https://source.test/a", "https://example.com/page"]
    );
    expect(result.map((x) => x.url)).toEqual([
      "https://source.test/a",
      "https://example.com/page",
    ]);
    expect(result[0].domain).toBe("source.test");
  });

  it("labels live, cached and heuristic states correctly", () => {
    expect(normalizeEngineResult({
      engine: "perplexity", score: 80, mentioned: true, live: true, cacheHit: false,
      snippet: "We recommend Acme."
    }, "Acme").state).toBe("LIVE");

    expect(normalizeEngineResult({
      engine: "perplexity", score: 80, mentioned: true, live: true, cacheHit: true,
      snippet: "We recommend Acme."
    }, "Acme").state).toBe("CACHED");

    expect(normalizeEngineResult({
      engine: "perplexity", score: 40, mentioned: false, live: false,
      snippet: "Estimate only."
    }, "Acme").confidence).toBe("LOW");
  });

  it("detects recommendation, competitor inclusion and answer position", () => {
    const result = normalizeEngineResult({
      engine: "chatgpt", score: 90, mentioned: true, competitorMentioned: true, live: true,
      snippet: "Acme is a top choice. Beta is another option."
    }, "Acme", "Beta");
    expect(result.recommended).toBe(true);
    expect(result.competitorMentioned).toBe(true);
    expect(result.answerPosition).toBe(1);
  });

  it("classifies prompt intent deterministically", () => {
    expect(classifyPrompt("Acme vs Beta which is better?")).toBe("comparison");
    expect(classifyPrompt("best plumber near me")).toBe("buyer_local");
    expect(classifyPrompt("how do I fix this?")).toBe("informational");
    expect(classifyPrompt("best SEO tool")).toBe("recommendation");
  });

  it("calculates share of voice and volatility without mutation", () => {
    expect(calculateShareOfVoice(3, 1)).toBe(75);
    expect(calculateVolatility([50, 50])).toBe(0);
    expect(calculateVolatility([40, 60])).toBeCloseTo(20);
  });

  it("rejects negative mention counts", () => {
    expect(() => calculateShareOfVoice(-1, 2)).toThrow("INVALID_MENTION_COUNTS");
  });
});
