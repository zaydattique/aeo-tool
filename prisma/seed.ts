/**
 * AEO Command — Database Seed
 * 1) Upserts six regional plans
 * 2) Optionally creates SUPER_ADMIN if SEED_SUPER_ADMIN_EMAIL + SEED_SUPER_ADMIN_PASSWORD are set
 *
 * Run: npm run db:seed
 */

import { PrismaClient, BillingRegion } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const plans = [
  {
    name: "Starter",
    slug: "starter-pk",
    region: BillingRegion.PAKISTAN,
    priceMonthly: 4900,
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
    priceMonthly: 7900,
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
    priceMonthly: 9900,
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
  {
    name: "Starter",
    slug: "starter-int",
    region: BillingRegion.INTERNATIONAL,
    priceMonthly: 29900,
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
    priceMonthly: 39900,
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
    priceMonthly: 49900,
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

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "Skipping SUPER_ADMIN seed (set SEED_SUPER_ADMIN_EMAIL + SEED_SUPER_ADMIN_PASSWORD to create one)."
    );
    return;
  }

  if (password.length < 12) {
    console.warn(
      "SEED_SUPER_ADMIN_PASSWORD should be at least 12 characters — skipping super admin."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const fullName =
    process.env.SEED_SUPER_ADMIN_NAME?.trim() || "Super Admin";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      agencyId: null,
      fullName,
      emailVerified: new Date(),
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      fullName,
      role: "SUPER_ADMIN",
      agencyId: null,
      emailVerified: new Date(),
    },
  });

  console.log(`  ✓ SUPER_ADMIN ready: ${user.email} (login → /admin)`);
}

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

  console.log("Seeding super admin (optional)...");
  await seedSuperAdmin();

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
