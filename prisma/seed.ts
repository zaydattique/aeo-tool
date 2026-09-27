/**
 * AEO Command — Database Seed
 * Creates the three plans for both Pakistan and International regions.
 *
 * Run: npm run db:seed
 * (requires DATABASE_URL and `npx prisma generate` first)
 */

import { PrismaClient, BillingRegion } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  // ── Pakistan (PKR, prices in full rupees stored as integer)
  {
    name: "Starter",
    slug: "starter-pk",
    region: BillingRegion.PAKISTAN,
    priceMonthly: 4900, // Rs 4,900
    currency: "PKR",
    maxClients: 5,
    maxScansPerMonth: 30,
    maxTrackedPrompts: 20,
    maxTeamSeats: 2,
    whiteLabel: false,
    features: {
      prioritySupport: false,
      customPrompts: true,
      weeklyRescan: false,
    },
    sortOrder: 1,
  },
  {
    name: "Growth",
    slug: "growth-pk",
    region: BillingRegion.PAKISTAN,
    priceMonthly: 7900, // Rs 7,900
    currency: "PKR",
    maxClients: 15,
    maxScansPerMonth: 100,
    maxTrackedPrompts: 75,
    maxTeamSeats: 5,
    whiteLabel: true,
    features: {
      prioritySupport: true,
      customPrompts: true,
      weeklyRescan: true,
    },
    sortOrder: 2,
  },
  {
    name: "Agency",
    slug: "agency-pk",
    region: BillingRegion.PAKISTAN,
    priceMonthly: 9900, // Rs 9,900
    currency: "PKR",
    maxClients: 50,
    maxScansPerMonth: 300,
    maxTrackedPrompts: 200,
    maxTeamSeats: 15,
    whiteLabel: true,
    features: {
      prioritySupport: true,
      customPrompts: true,
      weeklyRescan: true,
      apiAccess: true,
    },
    sortOrder: 3,
  },

  // ── International (USD, prices in cents)
  {
    name: "Starter",
    slug: "starter-int",
    region: BillingRegion.INTERNATIONAL,
    priceMonthly: 29900, // $299.00
    currency: "USD",
    maxClients: 5,
    maxScansPerMonth: 30,
    maxTrackedPrompts: 20,
    maxTeamSeats: 2,
    whiteLabel: false,
    features: {
      prioritySupport: false,
      customPrompts: true,
      weeklyRescan: false,
    },
    sortOrder: 1,
  },
  {
    name: "Growth",
    slug: "growth-int",
    region: BillingRegion.INTERNATIONAL,
    priceMonthly: 39900, // $399.00
    currency: "USD",
    maxClients: 15,
    maxScansPerMonth: 100,
    maxTrackedPrompts: 75,
    maxTeamSeats: 5,
    whiteLabel: true,
    features: {
      prioritySupport: true,
      customPrompts: true,
      weeklyRescan: true,
    },
    sortOrder: 2,
  },
  {
    name: "Agency",
    slug: "agency-int",
    region: BillingRegion.INTERNATIONAL,
    priceMonthly: 49900, // $499.00
    currency: "USD",
    maxClients: 50,
    maxScansPerMonth: 300,
    maxTrackedPrompts: 200,
    maxTeamSeats: 15,
    whiteLabel: true,
    features: {
      prioritySupport: true,
      customPrompts: true,
      weeklyRescan: true,
      apiAccess: true,
    },
    sortOrder: 3,
  },
];

async function main() {
  console.log("Seeding plans...");

  for (const plan of plans) {
    const result = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        region: plan.region,
        priceMonthly: plan.priceMonthly,
        currency: plan.currency,
        maxClients: plan.maxClients,
        maxScansPerMonth: plan.maxScansPerMonth,
        maxTrackedPrompts: plan.maxTrackedPrompts,
        maxTeamSeats: plan.maxTeamSeats,
        whiteLabel: plan.whiteLabel,
        features: plan.features,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      create: plan,
    });
    console.log(`  ✓ ${result.slug} (${result.currency} ${result.priceMonthly})`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
