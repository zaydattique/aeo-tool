import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://threezero.agency";

const root = siteUrl.replace(/\/$/, "");
const ogImage = `${root}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AEO Command — Answer Engine Optimization for Agencies",
    template: "%s | AEO Command",
  },
  description:
    "AEO Command is the multi-tenant Answer Engine Optimization platform for agencies. Scan any client site, get a prioritized Action Center, track AI visibility, and deliver white-label reports.",
  keywords: [
    "AEO",
    "Answer Engine Optimization",
    "GEO",
    "Generative Engine Optimization",
    "AEO tool",
    "AEO platform",
    "AEO tool for agencies",
    "agency AEO software",
    "white-label AEO report",
    "multi-client AEO",
    "AI SEO",
    "ChatGPT optimization",
    "Perplexity visibility",
    "AI visibility tracking",
  ],
  authors: [{ name: "Threezero Agency", url: "https://threezero.agency" }],
  creator: "Threezero Agency",
  publisher: "Threezero Agency",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: root,
    siteName: "AEO Command",
    title: "AEO Command — Answer Engine Optimization for Agencies",
    description:
      "Paste a client URL → prioritized Action Center → track AI visibility → white-label report. Built for multi-tenant agencies.",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "AEO Command — Answer Engine Optimization for agencies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AEO Command — AEO Platform for Agencies",
    description:
      "Scan, act, track, and report on Answer Engine Optimization — multi-client control for agencies.",
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: root,
  },
};

const graphJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${root}/#organization`,
      name: "Threezero Agency",
      url: "https://threezero.agency",
      logo: {
        "@type": "ImageObject",
        url: ogImage,
      },
      sameAs: ["https://threezero.agency", "https://github.com/zaydattique"],
      description:
        "Threezero Agency builds and operates AEO Command, a multi-tenant Answer Engine Optimization platform for marketing agencies.",
    },
    {
      "@type": "WebSite",
      "@id": `${root}/#website`,
      url: root,
      name: "AEO Command",
      description:
        "Multi-tenant Answer Engine Optimization (AEO) SaaS for agencies — scan, Action Center, visibility tracking, white-label reports.",
      publisher: { "@id": `${root}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${root}/#software`,
      name: "AEO Command",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: root,
      image: ogImage,
      description:
        "Multi-tenant Answer Engine Optimization (AEO) platform for marketing agencies. Scan websites, prioritize fixes in an Action Center, track AI visibility prompts, and deliver white-label live reports.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "14-day free trial",
        url: `${root}/signup`,
      },
      publisher: { "@id": `${root}/#organization` },
      brand: { "@id": `${root}/#organization` },
      featureList: [
        "Website AEO scan",
        "Prioritized Action Center",
        "AI visibility prompt tracking",
        "White-label live reports",
        "Multi-tenant agency isolation",
        "Team invites and roles",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graphJsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
