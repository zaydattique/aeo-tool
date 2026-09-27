import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://threezero.agency";

export default function sitemap(): MetadataRoute.Sitemap {
  const root = base.replace(/\/$/, "");
  const now = new Date();

  const paths: { path: string; priority: number; freq: "weekly" | "monthly" }[] =
    [
      { path: "", priority: 1, freq: "weekly" },
      { path: "/product", priority: 0.9, freq: "monthly" },
      { path: "/pricing", priority: 0.9, freq: "monthly" },
      { path: "/aeo", priority: 0.95, freq: "weekly" },
      { path: "/guides", priority: 0.9, freq: "weekly" },
      { path: "/guides/aeo-checklist", priority: 0.85, freq: "monthly" },
      { path: "/guides/chatgpt-citations", priority: 0.85, freq: "monthly" },
      { path: "/guides/perplexity-visibility", priority: 0.85, freq: "monthly" },
      { path: "/compare/aeo-tools", priority: 0.9, freq: "monthly" },
      { path: "/ai", priority: 0.7, freq: "monthly" },
    ];

  return paths.map(({ path, priority, freq }) => ({
    url: `${root}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));
}
