/**
 * Paste-ready draft templates for Action Center fixes.
 * Used by heuristic analysis enrichment and optional AI redraft fallback.
 */

export type DraftContext = {
  brandName?: string | null;
  websiteUrl?: string | null;
  title?: string | null;
};

function brand(ctx: DraftContext) {
  return ctx.brandName || "Your Brand";
}

function site(ctx: DraftContext) {
  return (ctx.websiteUrl || "https://example.com").replace(/\/$/, "");
}

export function enrichSuggestedFix(
  category: string,
  title: string,
  existingFix: string,
  ctx: DraftContext = {}
): string {
  const t = title.toLowerCase();
  const base = existingFix.trim();

  if (category === "SCHEMA" || t.includes("json-ld") || t.includes("schema")) {
    if (t.includes("faq")) {
      return [
        base,
        "",
        "Paste-ready FAQPage JSON-LD (edit Q&A to match visible page text):",
        "```html",
        `<script type="application/ld+json">`,
        JSON.stringify(
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `What does ${brand(ctx)} offer?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `${brand(ctx)} provides [service description]. Visit ${site(ctx)} for details.`,
                },
              },
              {
                "@type": "Question",
                name: `Where is ${brand(ctx)} located?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "[City / service area]. Contact us via the website.",
                },
              },
            ],
          },
          null,
          2
        ),
        "</script>",
        "```",
        "Ensure the same questions appear as visible HTML on the page.",
      ].join("\n");
    }

    if (t.includes("organization") || t.includes("entity") || t.includes("local")) {
      return [
        base,
        "",
        "Paste-ready Organization JSON-LD:",
        "```html",
        `<script type="application/ld+json">`,
        JSON.stringify(
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: brand(ctx),
            url: site(ctx),
            logo: `${site(ctx)}/logo.png`,
            sameAs: [],
          },
          null,
          2
        ),
        "</script>",
        "```",
        "Add sameAs profiles (LinkedIn, Google Business, directories) that match the brand name exactly.",
      ].join("\n");
    }

    return [
      base,
      "",
      "Generic JSON-LD shell (pick the correct @type for the page):",
      "```html",
      `<script type="application/ld+json">`,
      JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: ctx.title || brand(ctx),
          url: site(ctx),
          isPartOf: { "@type": "WebSite", name: brand(ctx), url: site(ctx) },
        },
        null,
        2
      ),
      "</script>",
      "```",
    ].join("\n");
  }

  if (t.includes("meta description") || (category === "CONTENT" && t.includes("meta"))) {
    return [
      base,
      "",
      "Template:",
      "```html",
      `<meta name="description" content="${brand(ctx)} — [primary benefit] in [location]. [Proof or CTA].">`,
      "```",
      "Keep 120–160 characters. Match the H1 intent.",
    ].join("\n");
  }

  if (t.includes("title") && (t.includes("missing") || t.includes("weak") || t.includes("page title"))) {
    return [
      base,
      "",
      "Template:",
      "```html",
      `<title>${brand(ctx)} | [Primary Service] in [Location]</title>`,
      "```",
      "Aim for 30–60 characters; lead with the entity users search for.",
    ].join("\n");
  }

  if (t.includes("canonical")) {
    return [
      base,
      "",
      "```html",
      `<link rel="canonical" href="${site(ctx)}/">`,
      "```",
      "Point every duplicate variant at the preferred HTTPS URL.",
    ].join("\n");
  }

  if (t.includes("h1")) {
    return [
      base,
      "",
      "Keep a single H1 that states the primary offer:",
      "```html",
      `<h1>${brand(ctx)} — [Primary Service]</h1>`,
      "```",
      "Demote extra H1s to H2. Answer the main question in the first paragraph under the H1.",
    ].join("\n");
  }

  if (t.includes("llms.txt")) {
    return [
      base,
      "",
      "Create /llms.txt at the site root:",
      "```text",
      `# ${brand(ctx)}`,
      "",
      `> ${brand(ctx)} — short factual description for AI systems.`,
      "",
      "## Key pages",
      `- [Home](${site(ctx)}/): overview`,
      `- [Services](${site(ctx)}/services): what we offer`,
      `- [About](${site(ctx)}/about): entity / team`,
      "```",
    ].join("\n");
  }

  if (t.includes("open graph") || t.includes("og:")) {
    return [
      base,
      "",
      "```html",
      `<meta property="og:title" content="${brand(ctx)}">`,
      `<meta property="og:description" content="[One-line factual summary]">`,
      `<meta property="og:url" content="${site(ctx)}/">`,
      `<meta property="og:image" content="${site(ctx)}/og.png">`,
      `<meta property="og:type" content="website">`,
      "```",
    ].join("\n");
  }

  if (t.includes("thin content") || t.includes("word count")) {
    return [
      base,
      "",
      "Content outline for AI-citable depth:",
      "1. Answer-first intro (2–3 sentences stating who/what/where).",
      "2. H2 sections for services, process, proof, FAQ.",
      "3. Specific facts (numbers, cities, constraints) models can quote.",
      "4. Internal links to related service / location pages.",
      "Target 600+ words on primary money pages without fluff.",
    ].join("\n");
  }

  if (t.includes("viewport")) {
    return [
      base,
      "",
      "```html",
      `<meta name="viewport" content="width=device-width, initial-scale=1">`,
      "```",
    ].join("\n");
  }

  if (t.includes("alt text") || t.includes("alt attribute")) {
    return [
      base,
      "",
      "Pattern: describe the image purpose, not just ‘image’.",
      "```html",
      `<img src="/team.jpg" alt="${brand(ctx)} team at [location] office">`,
      "```",
    ].join("\n");
  }

  // Generic enrichment: structured implement / verify / report steps if still thin
  if (base.length < 80) {
    return [
      base,
      "",
      "Implementation checklist:",
      "1. Apply the change on the live template (or CMS block) for the audited URL.",
      "2. Verify in view-source / Rich Results Test / URL Inspection.",
      "3. Re-scan in AEO Command and mark this action Done.",
    ].join("\n");
  }

  return base;
}

export function buildRichSteps(
  suggestedText: string
): { order: number; text: string }[] {
  const text = suggestedText.trim();
  if (!text) {
    return [
      { order: 1, text: "Review this recommendation and implement the fix." },
      { order: 2, text: "Verify the change is live." },
      { order: 3, text: "Mark Done in Action Center." },
    ];
  }

  const codeSplit = text.split(/```/);
  const steps: { order: number; text: string }[] = [];
  let order = 1;

  // Prose before first fence
  const intro = codeSplit[0]
    ?.split(/\n+/)
    .map((l) => l.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim())
    .filter((l) => l.length > 8);

  if (intro && intro.length > 0) {
    for (const line of intro.slice(0, 4)) {
      steps.push({ order: order++, text: line.slice(0, 500) });
    }
  }

  if (codeSplit.length >= 3) {
    steps.push({
      order: order++,
      text: "Paste the provided code/template into the page or CMS (edit placeholders).",
    });
  }

  steps.push({
    order: order++,
    text: "Verify live (view-source, schema tester, or URL inspection).",
  });
  steps.push({
    order: order++,
    text: "Mark this action Done and note residual risk for the client report.",
  });

  return steps.slice(0, 8);
}
