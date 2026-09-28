/**
 * Maps AEO analysis issues into Action Center drafts.
 * Enriches suggested fixes with paste-ready templates and concrete steps.
 */

import type { AeoIssue } from "./ai-analysis";
import {
  enrichSuggestedFix,
  buildRichSteps,
  type DraftContext,
} from "./action-draft-templates";

export type ActionDraft = {
  order: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: AeoIssue["category"];
  title: string;
  whyItMatters: string;
  effortLevel: "LOW" | "MEDIUM" | "HIGH";
  suggestedText: string;
  steps: { order: number; text: string }[];
};

const PRIORITY_RANK: Record<string, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
}

export function mapIssuesToActionDrafts(
  issues: AeoIssue[],
  ctx: DraftContext = {}
): ActionDraft[] {
  const sorted = [...issues].sort((a, b) => {
    const pr =
      (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    if (pr !== 0) return pr;
    return (
      (a.effort === "LOW" ? 0 : a.effort === "MEDIUM" ? 1 : 2) -
      (b.effort === "LOW" ? 0 : b.effort === "MEDIUM" ? 1 : 2)
    );
  });

  const seen = new Set<string>();
  const drafts: ActionDraft[] = [];

  for (const issue of sorted) {
    const key = normalizeTitle(issue.title);
    if (seen.has(key)) continue;
    seen.add(key);

    const rawFix = issue.suggestedFix?.trim() || issue.title;
    const suggestedText = enrichSuggestedFix(
      issue.category,
      issue.title,
      rawFix,
      ctx
    ).slice(0, 8000);

    drafts.push({
      order: drafts.length + 1,
      priority: issue.priority,
      category: issue.category,
      title: issue.title.trim().slice(0, 500),
      whyItMatters: issue.whyItMatters.trim().slice(0, 2000),
      effortLevel: issue.effort,
      suggestedText,
      steps: buildRichSteps(suggestedText),
    });
  }

  return drafts.slice(0, 15);
}

/** Re-enrich a single action body (template layer; AI optional separately). */
export function enrichActionFields(opts: {
  category: string;
  title: string;
  suggestedText: string;
  ctx?: DraftContext;
}) {
  const suggestedText = enrichSuggestedFix(
    opts.category,
    opts.title,
    opts.suggestedText,
    opts.ctx || {}
  ).slice(0, 8000);
  return {
    suggestedText,
    steps: buildRichSteps(suggestedText),
  };
}
