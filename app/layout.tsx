import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://threezero.agency";

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
    "AI SEO",
    "ChatGPT optimization",
    "Perplexity SEO",
    "agency AEO software",
    "white-label AEO report",
  ],
  authors: [{ name: "Threezero Agency" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AEO Command",
    title: "AEO Command — Answer Engine Optimization for Agencies",
    description:
      "Paste a client URL → prioritized Action Center → track AI visibility → white-label report. Built for agencies.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AEO Command — AEO Platform for Agencies",
    description:
      "Scan, act, track, and report on Answer Engine Optimization — multi-client control for agencies.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: siteUrl,
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AEO Command",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "14-day free trial",
  },
  description:
    "Multi-tenant Answer Engine Optimization (AEO) platform for marketing agencies. Scan websites, prioritize fixes, track AI visibility, deliver white-label reports.",
  url: siteUrl,
  publisher: {
    "@type": "Organization",
    name: "Threezero Agency",
    url: "https://threezero.agency",
  },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
