import { CANONICAL_METRICS, assertCanonicalMetricRegistry } from "../analytics/registry";
import { weightedMean, rate, correlation } from "../analytics/calculations";

describe("Phase 3 canonical analytics contracts", () => {
  it("contains 50+ unique metrics with methodology inputs", () => {
    assertCanonicalMetricRegistry();
    expect(CANONICAL_METRICS.length).toBeGreaterThanOrEqual(50);
  });
  it("calculates weighted observations deterministically", () => {
    expect(weightedMean([{value:10},{value:20}])).toBe(15);
    expect(weightedMean([{value:10,weight:2},{value:20,weight:1}])).toBeCloseTo(13.333333);
  });
  it("does not fabricate rates for invalid denominators", () => {
    expect(rate(2,4)).toBe(0.5);
    expect(rate(0,0)).toBe(0);
    expect(() => rate(5,4)).toThrow("INVALID_RATE_INPUT");
  });
  it("supports historical correlation deterministically", () => {
    expect(correlation([1,2,3],[2,4,6])).toBeCloseTo(1);
  });
});
