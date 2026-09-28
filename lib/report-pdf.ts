import PDFDocument from "pdfkit";

export type ReportPdfInput = {
  agencyName: string;
  clientName: string;
  websiteUrl?: string;
  visibilityScore?: number | null;
  generatedAt?: string;
  summary?: string;
  scores?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  actions?: {
    priority: string;
    category: string;
    title: string;
    whyItMatters: string;
    status: string;
    suggestedText?: string | null;
  }[];
  prompts?: { promptText: string; latestScore: number | null }[];
  footerNote?: string;
};

/** Build a branded AEO report PDF buffer (no browser required). */
export function buildReportPdf(input: ReportPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `AEO Report — ${input.clientName}`,
        Author: input.agencyName,
        Creator: "AEO Command",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const width =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fontSize(10).fillColor("#64748b").text(input.agencyName, left, 50);
    doc.moveDown(0.5);
    doc.fontSize(20).fillColor("#0f172a").text("AEO Visibility Report");
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor("#334155").text(input.clientName);
    if (input.websiteUrl) {
      doc.fontSize(10).fillColor("#64748b").text(input.websiteUrl);
    }
    if (input.generatedAt) {
      doc
        .fontSize(9)
        .fillColor("#94a3b8")
        .text(`Generated ${new Date(input.generatedAt).toLocaleString()}`);
    }

    doc.moveDown(1);
    doc
      .moveTo(left, doc.y)
      .lineTo(left + width, doc.y)
      .strokeColor("#e2e8f0")
      .stroke();
    doc.moveDown(1);

    doc.fontSize(9).fillColor("#64748b").text("VISIBILITY SCORE");
    doc.moveDown(0.3);
    doc
      .fontSize(28)
      .fillColor("#0f172a")
      .text(
        input.visibilityScore != null ? `${input.visibilityScore} / 100` : "—"
      );

    if (input.summary) {
      doc.moveDown(1);
      sectionTitle(doc, "Summary");
      doc.fontSize(10).fillColor("#334155").text(input.summary, {
        width,
        align: "left",
      });
    }

    if (input.scores && Object.keys(input.scores).length > 0) {
      doc.moveDown(1);
      sectionTitle(doc, "Dimension scores");
      for (const [k, v] of Object.entries(input.scores)) {
        doc
          .fontSize(10)
          .fillColor("#334155")
          .text(`${capitalize(k)}: ${v}`, { continued: false });
      }
    }

    if (input.strengths && input.strengths.length > 0) {
      doc.moveDown(1);
      sectionTitle(doc, "Strengths");
      for (const s of input.strengths) {
        bullet(doc, s, width);
      }
    }

    if (input.weaknesses && input.weaknesses.length > 0) {
      doc.moveDown(1);
      sectionTitle(doc, "Weaknesses");
      for (const s of input.weaknesses) {
        bullet(doc, s, width);
      }
    }

    if (input.actions && input.actions.length > 0) {
      doc.moveDown(1);
      sectionTitle(doc, `Recommended actions (${input.actions.length})`);
      for (const a of input.actions) {
        ensureSpace(doc, 60);
        doc
          .fontSize(9)
          .fillColor("#64748b")
          .text(`${a.priority} · ${a.category} · ${a.status}`);
        doc.fontSize(11).fillColor("#0f172a").text(a.title, { width });
        doc.fontSize(9).fillColor("#475569").text(a.whyItMatters, { width });
        if (a.suggestedText) {
          doc
            .fontSize(9)
            .fillColor("#334155")
            .text(`Fix: ${a.suggestedText}`, { width });
        }
        doc.moveDown(0.6);
      }
    }

    if (input.prompts && input.prompts.length > 0) {
      doc.moveDown(0.5);
      sectionTitle(doc, "Tracked prompts");
      for (const p of input.prompts) {
        ensureSpace(doc, 24);
        const score =
          p.latestScore != null ? String(p.latestScore) : "—";
        doc
          .fontSize(9)
          .fillColor("#334155")
          .text(`${p.promptText}  ·  ${score}`, { width });
      }
    }

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        input.footerNote ||
          `Prepared by ${input.agencyName} · Powered by AEO Command`,
        { width }
      );

    doc.end();
  });
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 40);
  doc.fontSize(9).fillColor("#64748b").text(title.toUpperCase());
  doc.moveDown(0.4);
}

function bullet(doc: PDFKit.PDFDocument, text: string, width: number) {
  ensureSpace(doc, 20);
  doc.fontSize(10).fillColor("#334155").text(`• ${text}`, { width });
}

function ensureSpace(doc: PDFKit.PDFDocument, need: number) {
  if (doc.y + need > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
