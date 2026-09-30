import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildReportPdf } from "@/lib/report-pdf";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = await rateLimit(`pdf-portal:${ip}`, 30, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { token } = await params;

  const client = await prisma.client.findFirst({
    where: {
      portalToken: token,
      portalEnabled: true,
      deletedAt: null,
    },
    include: {
      agency: { select: { name: true } },
      actions: {
        where: { deletedAt: null },
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        take: 40,
      },
      trackedPrompts: {
        where: { deletedAt: null },
        take: 20,
        include: {
          snapshots: { orderBy: { recordedAt: "desc" }, take: 1 },
        },
      },
      scans: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { aiAnalysis: true },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  const analysis =
    (client.scans[0]?.aiAnalysis as {
      summary?: string;
      scores?: Record<string, number>;
      strengths?: string[];
      weaknesses?: string[];
    } | null) || null;

  try {
    const pdf = await buildReportPdf({
      agencyName: client.agency.name,
      clientName: client.name,
      websiteUrl: client.websiteUrl,
      visibilityScore: client.currentVisibilityScore,
      generatedAt: new Date().toISOString(),
      summary: analysis?.summary,
      scores: analysis?.scores,
      strengths: analysis?.strengths,
      weaknesses: analysis?.weaknesses,
      actions: client.actions.map((a) => ({
        priority: a.priority,
        category: a.category,
        title: a.title,
        whyItMatters: a.whyItMatters,
        status: a.status,
        suggestedText: a.suggestedText,
      })),
      prompts: client.trackedPrompts.map((p) => ({
        promptText: p.promptText,
        latestScore:
          p.snapshots[0] != null ? Number(p.snapshots[0].score) : null,
      })),
      footerNote: `Prepared by ${client.agency.name} · Live portal snapshot · Powered by AEO Command`,
    });

    const safeName = client.name.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 40);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="aeo-portal-${safeName}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Portal PDF error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
