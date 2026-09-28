/** Default + competitor prompts for visibility / SOV tracking */

export type PromptSeed = {
  promptText: string;
  kind: "brand" | "category" | "competitor";
  targetName?: string | null;
};

export function getDefaultPrompts(
  brandName: string,
  location?: string | null
): string[] {
  return getDefaultPromptSeeds(brandName, location).map((p) => p.promptText);
}

export function getDefaultPromptSeeds(
  brandName: string,
  location?: string | null
): PromptSeed[] {
  const brand = brandName || "this brand";
  const loc = location ? ` in ${location}` : "";

  return [
    {
      promptText: `What is ${brand} known for${loc}?`,
      kind: "brand",
    },
    {
      promptText: `Is ${brand} recommended by experts${loc}?`,
      kind: "brand",
    },
    {
      promptText: `What does ${brand} specialize in?`,
      kind: "brand",
    },
    {
      promptText: `Who are the top options${loc} for this category?`,
      kind: "category",
    },
    {
      promptText: `How does ${brand} compare to competitors${loc}?`,
      kind: "category",
    },
  ];
}

export function getCompetitorPromptSeeds(
  brandName: string,
  competitors: string[],
  location?: string | null
): PromptSeed[] {
  const brand = brandName || "this brand";
  const loc = location ? ` in ${location}` : "";
  const seeds: PromptSeed[] = [];

  for (const raw of competitors) {
    const comp = raw.trim();
    if (!comp) continue;
    seeds.push({
      promptText: `${brand} vs ${comp}${loc} — which is better and why?`,
      kind: "competitor",
      targetName: comp,
    });
    seeds.push({
      promptText: `Is ${comp} better than ${brand}${loc}?`,
      kind: "competitor",
      targetName: comp,
    });
  }

  return seeds;
}
