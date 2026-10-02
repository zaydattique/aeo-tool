import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildReportPdf } from "@/lib/report-pdf";
import { checkPdfRateLimit } from "@/lib/expensive-rate-limits";
import { getClientIp } from "@/lib/request-security";

type ReportConfig = {
  agencyName?: string;
  clientName?: string;
  websiteUrl?: string;
  visibilityScore?: number | null;
  generatedAt?: string;
  analysis?: {
    summary?: string;
    scores?: Record<string, number>;
    strengths?: string[];
    weaknesses?: string[];
  } | null;
  actions?: {
    priority: string;
    category: string;
    title: string;
    whyItMatters: string;
    status: string;
    suggestedText?: string | null;
  }[];
  prompts?: { promptText: string; latestScore: number | null }[];
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = getClientIp(req);
  const rl = await checkPdfRateLimit(ip, token, "report");
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const report = await prisma.report.findFirst({
    where: { liveLinkToken: token, deletedAt: null },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const config = (report.config as ReportConfig) || {};

  try {
    const pdf = await buildReportPdf({
      agencyName: config.agencyName || "Agency",
      clientName: config.clientName || "Client",
      websiteUrl: config.websiteUrl,
      visibilityScore: config.visibilityScore,
      generatedAt: config.generatedAt || report.createdAt.toISOString(),
      summary: config.analysis?.summary,
      scores: config.analysis?.scores,
      strengths: config.analysis?.strengths,
      weaknesses: config.analysis?.weaknesses,
      actions: config.actions,
      prompts: config.prompts,
    });

    const safeName = (config.clientName || "report")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .slice(0, 40);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="aeo-report-${safeName}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
