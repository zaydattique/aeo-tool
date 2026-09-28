/**
 * Maps AEO analysis issues into Action Center drafts.
 * Sorts by priority, expands suggested fixes into concrete steps,
 * and dedupes near-identical titles.
 */

import type { AeoIssue } from "./ai-analysis";

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

/** Split a long suggested fix into ordered implementation steps. */
export function expandSteps(suggestedFix: string): { order: number; text: string }[] {
  const text = suggestedFix.trim();
  if (!text) {
    return [{ order: 1, text: "Review this recommendation and implement the fix." }];
  }

  // Prefer explicit numbered / bulleted lists
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    return lines.slice(0, 6).map((l, i) => ({ order: i + 1, text: l }));
  }

  // Split on sentence boundaries for long single-paragraph fixes
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  if (sentences.length >= 2) {
    return sentences.slice(0, 5).map((s, i) => ({ order: i + 1, text: s }));
  }

  // Default three-step agency workflow
  return [
    { order: 1, text: `Implement: ${text}` },
    {
      order: 2,
      text: "Verify the change is live (view source / rich results / URL inspect).",
    },
    {
      order: 3,
      text: "Mark this action Done and note any residual risk for the client report.",
    },
  ];
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
}

export function mapIssuesToActionDrafts(issues: AeoIssue[]): ActionDraft[] {
  const sorted = [...issues].sort((a, b) => {
    const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    if (pr !== 0) return pr;
    const er =
      (PRIORITY_RANK[a.effort === "LOW" ? "HIGH" : a.effort === "HIGH" ? "LOW" : "MEDIUM"] ??
        1) -
      (PRIORITY_RANK[b.effort === "LOW" ? "HIGH" : b.effort === "HIGH" ? "LOW" : "MEDIUM"] ??
        1);
    // Prefer HIGH priority first; within same priority prefer lower effort (quick wins)
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

    const suggestedText = issue.suggestedFix?.trim() || issue.title;
    drafts.push({
      order: drafts.length + 1,
      priority: issue.priority,
      category: issue.category,
      title: issue.title.trim().slice(0, 500),
      whyItMatters: issue.whyItMatters.trim().slice(0, 2000),
      effortLevel: issue.effort,
      suggestedText: suggestedText.slice(0, 2000),
      steps: expandSteps(suggestedText),
    });
  }

  // Cap to keep Action Center actionable (not a dump)
  return drafts.slice(0, 15);
}
