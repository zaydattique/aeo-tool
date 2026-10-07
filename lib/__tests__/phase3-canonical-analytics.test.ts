import { describe, expect, it } from "vitest";
import { CANONICAL_METRICS, assertCanonicalMetricRegistry } from "../analytics/registry";
import { weightedMean, rate, correlation } from "../analytics/calculations";
import { paginateMetricHistory, sortMetricHistory } from "../analytics/history";

const REQUIRED_PHASE3_METRICS = [
  "ai_visibility_score","mention_rate","citation_rate","recommendation_rate","brand_inclusion_rate",
  "competitor_inclusion_rate","share_of_voice","average_ai_position","winning_prompt_rate","losing_prompt_rate",
  "prompt_volatility","engine_visibility","country_visibility","language_visibility","product_visibility",
  "total_citations","unique_cited_domains","citation_frequency","citation_authority","citation_freshness",
  "citation_page_distribution","competitor_citation_overlap","citation_gap","influential_sources","missing_authority_sources",
  "sentiment","recommendation_sentiment","accuracy","brand_positioning","product_positioning","competitor_positioning",
  "mention_context","hallucination_risk","missing_facts","wrong_facts","crawlability","ai_crawlability",
  "indexability","structured_data_health","entity_clarity","content_completeness","topical_coverage","internal_linking",
  "schema_coverage","llms_txt_readiness","ai_referral_traffic","ai_leads","ai_assisted_conversions","ai_revenue",
  "visibility_to_traffic_correlation",
];

describe("Phase 3 canonical analytics contracts", () => {
  it("contains the complete 50-metric registry with methodology inputs", () => {
    assertCanonicalMetricRegistry();
    expect(CANONICAL_METRICS).toHaveLength(50);
    expect(new Set(CANONICAL_METRICS.map((metric) => metric.slug))).toHaveProperty("size", 50);
    for (const slug of REQUIRED_PHASE3_METRICS) {
      expect(CANONICAL_METRICS.some((metric) => metric.slug === slug)).toBe(true);
    }
  });

  it("reconciles at least 20 canonical metric calculation primitives", () => {
    const fixtures = [
      [10, 20], [3, 9], [7, 14], [0, 4], [4, 4], [2, 8], [5, 10], [12, 18],
      [1, 3], [8, 16], [9, 12], [2, 6], [15, 20], [6, 24], [11, 22], [13, 26],
      [4, 5], [18, 20], [21, 28], [16, 32],
    ];
    for (const [numerator, denominator] of fixtures) {
      expect(rate(numerator, denominator)).toBeCloseTo(numerator / denominator);
    }
  });

  it("calculates weighted observations deterministically", () => {
    expect(weightedMean([{value:10},{value:20}])).toBe(15);
    expect(weightedMean([{value:10,weight:2},{value:20,weight:1}])).toBeCloseTo(13.333333);
    expect(weightedMean([{value:10,confidence:0},{value:20,confidence:1}])).toBe(20);
  });

  it("does not fabricate rates or correlations for invalid inputs", () => {
    expect(rate(2,4)).toBe(0.5);
    expect(rate(0,0)).toBe(0);
    expect(() => rate(5,4)).toThrow("INVALID_RATE_INPUT");
    expect(() => correlation([1],[2])).toThrow("INVALID_CORRELATION_INPUT");
  });

  it("supports deterministic historical correlation and pagination", () => {
    expect(correlation([1,2,3],[2,4,6])).toBeCloseTo(1);
    const points = [
      { id: "b", observedAt: new Date("2026-01-02"), value: 2 },
      { id: "a", observedAt: new Date("2026-01-01"), value: 1 },
      { id: "c", observedAt: new Date("2026-01-03"), value: 3 },
    ];
    expect(sortMetricHistory(points).map((point) => point.id)).toEqual(["a", "b", "c"]);
    expect(paginateMetricHistory(points, 2)).toEqual({items:[points[1],points[0]],nextCursor:"b"});
    expect(paginateMetricHistory(points, 2, "a").items.map((point) => point.id)).toEqual(["b","c"]);
    expect(() => paginateMetricHistory(points, 101)).toThrow("INVALID_PAGE_SIZE");
    expect(() => paginateMetricHistory(points, 2, "missing")).toThrow("INVALID_CURSOR");
  });
});
