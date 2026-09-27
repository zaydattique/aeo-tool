/** Default prompts seeded when a client first enables visibility tracking */

export function getDefaultPrompts(brandName: string, location?: string | null): string[] {
  const brand = brandName || "this brand";
  const loc = location ? ` in ${location}` : "";

  return [
    `What is the best ${brand} alternative${loc}?`,
    `Who are the top competitors of ${brand}?`,
    `Is ${brand} recommended by experts${loc}?`,
    `What does ${brand} specialize in?`,
    `How does ${brand} compare to competitors${loc}?`,
  ];
}
