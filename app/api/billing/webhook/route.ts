import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

const MAX_BODY_BYTES = 1024 * 1024;

export async function POST(req: NextRequest) {
  const reader = req.body?.getReader();
  if (!reader) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        return NextResponse.json({ error: "Request body too large" }, { status: 413 });
      }
      chunks.push(value);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const body = new TextDecoder().decode(bytes);
  const sig = req.headers.get("stripe-signature");

  if (!process.env.STRIPE_WEBHOOK_SECRET || !sig) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { eventId: event.id },
    select: { processedAt: true },
  });

  if (existingEvent?.processedAt) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!existingEvent) {
    try {
      await prisma.stripeEvent.create({
        data: { eventId: event.id, eventType: event.type },
      });
    } catch {
      const duplicate = await prisma.stripeEvent.findUnique({
        where: { eventId: event.id },
        select: { processedAt: true },
      });
      if (duplicate?.processedAt) {
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw new Error("Unable to record webhook event");
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const agencyId = session.metadata?.agencyId;
        const planId = session.metadata?.planId;

        if (agencyId && planId && session.subscription) {
          const stripeSubscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          await prisma.agency.update({
            where: { id: agencyId },
            data: {
              planId,
              status: "ACTIVE",
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id,
            },
          });

          await prisma.subscription.upsert({
            where: { stripeSubscriptionId },
            create: {
              agencyId,
              planId,
              stripeSubscriptionId,
              status: "ACTIVE",
            },
            update: {
              planId,
              status: "ACTIVE",
            },
          });

          await prisma.activityLog.create({
            data: {
              agencyId,
              action: "billing.subscription_started",
              resourceType: "subscription",
              metadata: { planId, sessionId: session.id },
            },
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const agencyId = sub.metadata?.agencyId;

        const statusMap: Record<
          string,
          "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING" | "INCOMPLETE"
        > = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELLED",
          trialing: "TRIALING",
          incomplete: "INCOMPLETE",
          incomplete_expired: "CANCELLED",
          unpaid: "PAST_DUE",
        };

        const mapped = statusMap[sub.status] || "ACTIVE";

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: mapped,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });

        if (agencyId) {
          await prisma.agency.update({
            where: { id: agencyId },
            data: {
              ...(sub.metadata?.planId ? { planId: sub.metadata.planId } : {}),
              status:
                sub.status === "canceled"
                  ? "CANCELLED"
                  : sub.status === "active" || sub.status === "trialing"
                    ? "ACTIVE"
                    : undefined,
            },
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    await prisma.stripeEvent.update({
      where: { eventId: event.id },
      data: { error: "Handler failed" },
    }).catch(() => {});
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  await prisma.stripeEvent.update({
    where: { eventId: event.id },
    data: { processedAt: new Date(), error: null },
  });

  return NextResponse.json({ received: true });
}
