import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://threezero.agency";

const marketingAllow = [
  "/",
  "/product",
  "/pricing",
  "/aeo",
  "/guides",
  "/compare",
  "/case-studies",
  "/ai",
  "/llms.txt",
];

const privateDisallow = [
  "/dashboard",
  "/admin",
  "/api/",
  "/onboarding",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/invite",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "GPTBot",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "ChatGPT-User",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "PerplexityBot",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "ClaudeBot",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "Google-Extended",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "anthropic-ai",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: "CCBot",
        allow: marketingAllow,
        disallow: privateDisallow,
      },
    ],
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
