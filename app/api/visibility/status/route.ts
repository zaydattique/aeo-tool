import { NextResponse } from "next/server";
import { requireAgency } from "@/lib/session";
import { getLiveEngineCapabilities } from "@/lib/visibility-check";

/** Agency-only: which live engines are configured (no secret values). */
export async function GET() {
  const { error, status } = await requireAgency();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const engines = getLiveEngineCapabilities();
  const liveCount = engines.filter((e) => e.configured).length;

  return NextResponse.json({
    engines,
    liveCount,
    note:
      liveCount === 0
        ? "No live engine keys set — visibility checks use heuristics only. Add PERPLEXITY_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, and/or ANTHROPIC_API_KEY."
        : `${liveCount} live engine(s) configured. Unconfigured engines still return heuristic estimates.`,
  });
}
