import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";
import { billingPortalLimit, billingPortalWindowMs } from "@/lib/expensive-rate-limits";

export async function POST() {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.session.user.role !== "AGENCY_OWNER" && auth.session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only owners can manage billing" }, { status: 403 });
  }

  const rl = await rateLimit(`billing-portal:${auth.agencyId}`, billingPortalLimit(), billingPortalWindowMs());
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many billing portal requests. Try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const agency = await prisma.agency.findUnique({
    where: { id: auth.agencyId },
  });

  if (!agency?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account yet. Subscribe to a plan first." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: agency.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Portal failed" },
      { status: 500 }
    );
  }
}
