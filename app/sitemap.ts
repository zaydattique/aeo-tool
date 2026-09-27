import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://threezero.agency";

export default function sitemap(): MetadataRoute.Sitemap {
  const root = base.replace(/\/$/, "");
  const now = new Date();

  return [
    { url: root, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${root}/product`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${root}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${root}/aeo`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
  ];
}
