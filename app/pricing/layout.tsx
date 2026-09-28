import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Pakistan & International agency plans",
  description:
    "AEO Command pricing for agencies: Pakistan and International tiers with 14-day free trial. Multi-client scans, Action Center, visibility tracking, white-label reports.",
  keywords: [
    "AEO tool pricing",
    "agency AEO software cost",
    "white-label AEO report pricing",
    "AEO Command plans",
  ],
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
