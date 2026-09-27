import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://threezero.agency";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/product", "/pricing", "/aeo", "/llms.txt"],
        disallow: [
          "/dashboard",
          "/admin",
          "/api/",
          "/onboarding",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
