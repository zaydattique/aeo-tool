"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

const PLANS = {
  PAKISTAN: [
    {
      name: "Starter",
      slug: "starter-pk",
      price: "PKR 9,900",
      clients: 5,
      scans: 30,
      seats: 2,
      whiteLabel: false,
    },
    {
      name: "Growth",
      slug: "growth-pk",
      price: "PKR 24,900",
      clients: 20,
      scans: 120,
      seats: 5,
      whiteLabel: true,
      highlight: true,
    },
    {
      name: "Agency",
      slug: "agency-pk",
      price: "PKR 49,900",
      clients: 60,
      scans: 400,
      seats: 15,
      whiteLabel: true,
    },
  ],
  INTERNATIONAL: [
    {
      name: "Starter",
      slug: "starter-int",
      price: "$49",
      clients: 5,
      scans: 30,
      seats: 2,
      whiteLabel: false,
    },
    {
      name: "Growth",
      slug: "growth-int",
      price: "$129",
      clients: 20,
      scans: 120,
      seats: 5,
      whiteLabel: true,
      highlight: true,
    },
    {
      name: "Agency",
      slug: "agency-int",
      price: "$299",
      clients: 60,
      scans: 400,
      seats: 15,
      whiteLabel: true,
    },
  ],
};

export default function PricingPage() {
  const [region, setRegion] = useState<"PAKISTAN" | "INTERNATIONAL">("PAKISTAN");
  const plans = PLANS[region];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">
            Pricing for agencies
          </h1>
          <p className="mt-3 text-muted-foreground text-sm">
            Transparent plans for Answer Engine Optimization delivery. 14-day
            free trial on every tier. Cancel anytime.
          </p>
          <div className="mt-6 inline-flex rounded-lg border bg-white p-1 text-sm">
            <button
              type="button"
              onClick={() => setRegion("PAKISTAN")}
              className={`rounded-md px-4 py-1.5 ${
                region === "PAKISTAN"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Pakistan
            </button>
            <button
              type="button"
              onClick={() => setRegion("INTERNATIONAL")}
              className={`rounded-md px-4 py-1.5 ${
                region === "INTERNATIONAL"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              International
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.slug}
              className={`rounded-xl border bg-white p-6 flex flex-col ${
                p.highlight ? "ring-2 ring-primary shadow-md" : ""
              }`}
            >
              {p.highlight && (
                <span className="text-xs font-medium text-primary mb-2">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="mt-2 text-3xl font-bold">
                {p.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground flex-1">
                <li>{p.clients} clients</li>
                <li>{p.scans} scans / month</li>
                <li>{p.seats} team seats</li>
                <li>Action Center + visibility tracking</li>
                <li>
                  {p.whiteLabel
                    ? "White-label reports"
                    : "Standard reports"}
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block text-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto">
          Prices shown are list rates for AEO Command SaaS. Custom enterprise
          and reseller arrangements available via Threezero Agency.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
