/**
 * Share-of-answer helpers from latest visibility snapshots.
 * SOV ≈ client mention weight / (client + competitor weight) across prompts.
 */

export type SovPromptRow = {
  id: string;
  promptText: string;
  kind: string;
  targetName: string | null;
  latestScore: number | null;
  brandMentioned?: boolean | null;
  competitorMentioned?: boolean | null;
};

export type SovSummary = {
  clientSharePct: number | null;
  competitorSharePct: number | null;
  clientAvgScore: number | null;
  competitorAvgScore: number | null;
  brandPromptCount: number;
  competitorPromptCount: number;
  categoryPromptCount: number;
  byCompetitor: {
    name: string;
    avgScore: number;
    promptCount: number;
  }[];
  note: string;
};

export function computeSov(prompts: SovPromptRow[]): SovSummary {
  const brand = prompts.filter((p) => p.kind === "brand" || !p.kind);
  const category = prompts.filter((p) => p.kind === "category");
  const competitor = prompts.filter((p) => p.kind === "competitor");

  const avg = (rows: SovPromptRow[]) => {
    const scored = rows.filter((r) => r.latestScore != null) as {
      latestScore: number;
    }[];
    if (scored.length === 0) return null;
    return Math.round(
      scored.reduce((s, r) => s + r.latestScore, 0) / scored.length
    );
  };

  const clientAvg = avg([...brand, ...category]);
  const competitorAvg = avg(competitor);

  let clientSharePct: number | null = null;
  let competitorSharePct: number | null = null;

  if (clientAvg != null && competitorAvg != null) {
    const total = clientAvg + competitorAvg;
    if (total > 0) {
      clientSharePct = Math.round((clientAvg / total) * 100);
      competitorSharePct = 100 - clientSharePct;
    }
  } else if (clientAvg != null && competitor.length === 0) {
    clientSharePct = null;
  }

  const byName: Record<string, number[]> = {};
  for (const p of competitor) {
    const name = p.targetName || "Competitor";
    if (!byName[name]) byName[name] = [];
    if (p.latestScore != null) byName[name].push(p.latestScore);
  }

  const byCompetitor = Object.entries(byName).map(([name, scores]) => ({
    name,
    avgScore:
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
    promptCount: scores.length || competitor.filter((c) => c.targetName === name).length,
  }));

  return {
    clientSharePct,
    competitorSharePct,
    clientAvgScore: clientAvg,
    competitorAvgScore: competitorAvg,
    brandPromptCount: brand.length,
    competitorPromptCount: competitor.length,
    categoryPromptCount: category.length,
    byCompetitor,
    note:
      competitor.length === 0
        ? "Add competitors and seed competitor prompts, then record a check to compute share-of-answer."
        : clientAvg == null || competitorAvg == null
          ? "Record a visibility check so SOV can use latest scores."
          : "SOV is relative presence on tracked prompts (client avg vs competitor-prompt avg). Not a guarantee of live engine rank.",
  };
}
