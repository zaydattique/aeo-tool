export type MetricDefinition = {
  slug: string; category: string; formula: string; source: string; aggregation: string;
  timeWindow: string; confidenceMethod: string; displayFormat: string;
  engineApplicability: string[]; requiredInputs: string[];
};

const metric = (slug:string, category:string, formula:string, source:string, displayFormat="number", inputs:string[]=["observations"]) =>
  ({slug,category,formula,source,aggregation:"snapshot",timeWindow:"observation period",confidenceMethod:"source quality + sample size",displayFormat,engineApplicability:["all"],requiredInputs:inputs});

export const CANONICAL_METRICS: MetricDefinition[] = [
  metric("ai_visibility_score","ai_visibility","weighted visibility across eligible prompts","visibility snapshots","score"),
  metric("mention_rate","ai_visibility","mentions / eligible responses","AI responses","percent"),
  metric("citation_rate","ai_visibility","responses citing brand / responses","AI responses","percent"),
  metric("recommendation_rate","ai_visibility","recommendations / eligible responses","AI responses","percent"),
  metric("brand_inclusion_rate","ai_visibility","responses including brand / responses","AI responses","percent"),
  metric("competitor_inclusion_rate","ai_visibility","responses including competitors / responses","AI responses","percent"),
  metric("share_of_voice","ai_visibility","brand mentions / all tracked brand+competitor mentions","AI responses","percent"),
  metric("average_ai_position","ai_visibility","mean normalized brand position","AI responses","position"),
  metric("winning_prompt_rate","ai_visibility","winning prompts / comparable prompts","AI responses","percent"),
  metric("losing_prompt_rate","ai_visibility","losing prompts / comparable prompts","AI responses","percent"),
  metric("prompt_volatility","ai_visibility","normalized change in prompt outcomes","historical observations","score"),
  metric("engine_visibility","ai_visibility","visibility grouped by engine","AI responses","score"),
  metric("country_visibility","ai_visibility","visibility grouped by country","AI responses","score"),
  metric("language_visibility","ai_visibility","visibility grouped by language","AI responses","score"),
  metric("product_visibility","ai_visibility","visibility grouped by product","AI responses","score"),
  metric("total_citations","citation_intelligence","count of citation observations","citation evidence"),
  metric("unique_cited_domains","citation_intelligence","distinct cited domains","citation evidence"),
  metric("citation_frequency","citation_intelligence","citations / eligible responses","citation evidence","percent"),
  metric("citation_authority","citation_intelligence","weighted authority of cited sources","citation evidence","score"),
  metric("citation_freshness","citation_intelligence","weighted recency of cited sources","citation evidence","score"),
  metric("citation_page_distribution","citation_intelligence","citations grouped by page","citation evidence","distribution"),
  metric("competitor_citation_overlap","citation_intelligence","shared cited domains / competitor cited domains","citation evidence","percent"),
  metric("citation_gap","citation_intelligence","competitor authoritative citations absent for brand","citation evidence","count"),
  metric("influential_sources","citation_intelligence","sources weighted by citation frequency and authority","citation evidence","distribution"),
  metric("missing_authority_sources","citation_intelligence","high-value expected sources not represented","citation evidence","count"),
  metric("sentiment","ai_answer_intelligence","weighted sentiment of brand mentions","AI responses","score"),
  metric("recommendation_sentiment","ai_answer_intelligence","sentiment among recommendations","AI responses","score"),
  metric("accuracy","ai_answer_intelligence","verified facts / evaluated facts","brand evidence + AI responses","percent"),
  metric("brand_positioning","ai_answer_intelligence","normalized positioning score","AI responses","score"),
  metric("product_positioning","ai_answer_intelligence","normalized product positioning score","AI responses","score"),
  metric("competitor_positioning","ai_answer_intelligence","relative competitor positioning","AI responses","score"),
  metric("mention_context","ai_answer_intelligence","classified contexts of mentions","AI responses","distribution"),
  metric("hallucination_risk","ai_answer_intelligence","unverified or contradicted claims / claims","AI responses","percent"),
  metric("missing_facts","ai_answer_intelligence","approved facts absent from responses","AI responses","count"),
  metric("wrong_facts","ai_answer_intelligence","contradicted approved facts / evaluated facts","AI responses","count"),
  metric("crawlability","technical_intelligence","crawlable URLs / attempted URLs","crawl results","percent"),
  metric("ai_crawlability","technical_intelligence","AI-accessible URLs / eligible URLs","crawl results","percent"),
  metric("indexability","technical_intelligence","indexable URLs / crawled URLs","crawl results","percent"),
  metric("structured_data_health","technical_intelligence","valid required schema / required schema","crawl results","percent"),
  metric("entity_clarity","technical_intelligence","resolved entity signals / expected signals","crawl + brand evidence","score"),
  metric("content_completeness","technical_intelligence","required content signals present / required","crawl results","percent"),
  metric("topical_coverage","technical_intelligence","covered topic clusters / target clusters","content analysis","percent"),
  metric("internal_linking","technical_intelligence","healthy internal links / expected links","crawl results","score"),
  metric("schema_coverage","technical_intelligence","pages with valid relevant schema / eligible pages","crawl results","percent"),
  metric("llms_txt_readiness","technical_intelligence","llms.txt readiness checks passed / checks","crawl results","percent"),
  metric("ai_referral_traffic","business_attribution","AI referral sessions","analytics integration","number"),
  metric("ai_leads","business_attribution","leads attributed to AI referrals","analytics integration","number"),
  metric("ai_assisted_conversions","business_attribution","conversions with AI touchpoint","analytics integration","number"),
  metric("ai_revenue","business_attribution","revenue attributed to AI touchpoints","analytics integration","currency"),
  metric("visibility_to_traffic_correlation","business_attribution","correlation between visibility and traffic","metric history + analytics","correlation")
];

export function getMetricDefinition(slug:string): MetricDefinition {
  const found = CANONICAL_METRICS.find(m => m.slug === slug);
  if (!found) throw new Error(`UNKNOWN_METRIC:${slug}`);
  return found;
}

export function assertCanonicalMetricRegistry(): void {
  if (CANONICAL_METRICS.length < 50) throw new Error("METRIC_REGISTRY_TOO_SMALL");
  const slugs = new Set(CANONICAL_METRICS.map(m => m.slug));
  if (slugs.size !== CANONICAL_METRICS.length) throw new Error("DUPLICATE_METRIC_SLUG");
  const formulas = new Set<string>();
  for (const m of CANONICAL_METRICS) {
    if (!m.formula || !m.source || !m.requiredInputs.length) throw new Error(`INCOMPLETE_METRIC:${m.slug}`);
    if (formulas.has(m.formula)) throw new Error(`DUPLICATE_METRIC_FORMULA:${m.formula}`);
    formulas.add(m.formula);
  }
}
