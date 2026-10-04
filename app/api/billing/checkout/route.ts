import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";
import { billingCheckoutLimit, billingCheckoutWindowMs } from "@/lib/expensive-rate-limits";
import { readJsonBody } from "@/lib/request-security";

const schema = z.object({
  planSlug: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.session.user.role !== "AGENCY_OWNER" && auth.session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only owners can manage billing" }, { status: 403 });
  }

  const rl = await rateLimit(`billing-checkout:${auth.agencyId}`, billingCheckoutLimit(), billingCheckoutWindowMs());
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many billing checkout attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await readJsonBody<unknown>(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { slug: parsed.data.planSlug },
    });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id: auth.agencyId },
    });
    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let customerId = agency.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.session.user.email || undefined,
        name: agency.name,
        metadata: { agencyId: agency.id },
      });
      customerId = customer.id;
      await prisma.agency.update({
        where: { id: agency.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create price on the fly from plan (or use pre-created Stripe price IDs in production)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: plan.priceMonthly,
            recurring: { interval: "month" },
            product_data: {
              name: `AEO Command ${plan.name}`,
              metadata: { planSlug: plan.slug },
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/settings?billing=success`,
      cancel_url: `${appUrl}/dashboard/settings?billing=cancel`,
      metadata: {
        agencyId: agency.id,
        planId: plan.id,
        planSlug: plan.slug,
      },
      subscription_data: {
        metadata: {
          agencyId: agency.id,
          planId: plan.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof Error && err.message === "REQUEST_BODY_TOO_LARGE") return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
