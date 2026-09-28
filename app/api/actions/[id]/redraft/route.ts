import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, canManageClients } from "@/lib/session";
import { enrichActionFields } from "@/lib/action-mapper";

async function aiRedraft(opts: {
  title: string;
  category: string;
  whyItMatters: string;
  suggestedText: string;
  brandName: string;
  websiteUrl: string;
}): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_VISIBILITY_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 1200,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: `You are an AEO implementation specialist. Rewrite the suggested fix so an agency junior can paste and ship it.

Brand: ${opts.brandName}
URL: ${opts.websiteUrl}
Category: ${opts.category}
Action: ${opts.title}
Why it matters: ${opts.whyItMatters}
Current draft:\n${opts.suggestedText}

Requirements:
- Keep it actionable and specific to this brand/URL
- Include paste-ready HTML/JSON-LD/code in markdown fences when relevant
- No guarantees about rankings or AI citations
- Max ~600 words
- Plain text response only (markdown fences OK)`,
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const text = Array.isArray(json.content)
      ? json.content.map((c: { text?: string }) => c.text || "").join("")
      : "";
    return text.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!canManageClients(auth.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.action.findFirst({
    where: { id, agencyId: auth.agencyId, deletedAt: null },
    include: {
      client: {
        select: { name: true, brandName: true, websiteUrl: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  const brand = existing.client.brandName || existing.client.name;
  const ctx = {
    brandName: brand,
    websiteUrl: existing.client.websiteUrl,
  };

  let suggested =
    existing.suggestedText ||
    existing.title;
  let method: "ai" | "template" = "template";

  const ai = await aiRedraft({
    title: existing.title,
    category: existing.category,
    whyItMatters: existing.whyItMatters,
    suggestedText: suggested,
    brandName: brand,
    websiteUrl: existing.client.websiteUrl,
  });

  if (ai) {
    suggested = ai;
    method = "ai";
  }

  const enriched = enrichActionFields({
    category: existing.category,
    title: existing.title,
    suggestedText: suggested,
    ctx,
  });

  // If AI already produced rich text, prefer AI body but still ensure steps
  const suggestedText =
    method === "ai" ? suggested.slice(0, 8000) : enriched.suggestedText;
  const steps =
    method === "ai" ? enriched.steps : enriched.steps;

  const action = await prisma.action.update({
    where: { id },
    data: {
      suggestedText,
      steps,
    },
    include: {
      assignedTo: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      agencyId: auth.agencyId,
      actorId: auth.session.user.id,
      action: "action.redrafted",
      resourceType: "action",
      resourceId: id,
      metadata: { method },
    },
  });

  return NextResponse.json({ action, method });
}
