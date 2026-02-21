export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Helper to safely extract billing period from a Stripe subscription object.
// The Stripe API version may or may not include current_period_start/end
// depending on the SDK version, so we access them defensively.
function extractBillingPeriod(sub: Record<string, unknown>): {
  currentPeriodStart: Date | undefined;
  currentPeriodEnd: Date | undefined;
} {
  const start = sub.current_period_start as number | undefined;
  const end = sub.current_period_end as number | undefined;
  return {
    currentPeriodStart: start ? new Date(start * 1000) : undefined,
    currentPeriodEnd: end ? new Date(end * 1000) : undefined,
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Configuração ausente" }, { status: 500 });
    }
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription" && session.subscription && session.metadata?.tenantId) {
          const tenantId = session.metadata.tenantId;
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

          const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);
          const priceId = stripeSubscription.items.data[0]?.price.id;
          const period = extractBillingPeriod(stripeSubscription as unknown as Record<string, unknown>);

          const plan = await prisma.plan.findFirst({
            where: {
              features: {
                path: ["stripePriceId"],
                equals: priceId,
              },
            },
          });

          if (plan) {
            await prisma.subscription.upsert({
              where: { tenantId },
              create: {
                tenantId,
                planId: plan.id,
                status: "active",
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                currentPeriodStart: period.currentPeriodStart,
                currentPeriodEnd: period.currentPeriodEnd,
              },
              update: {
                planId: plan.id,
                status: "active",
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                currentPeriodStart: period.currentPeriodStart,
                currentPeriodEnd: period.currentPeriodEnd,
              },
            });

            await prisma.tenant.update({
              where: { id: tenantId },
              data: { status: "active" },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;

        const existingSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId },
        });

        if (existingSub) {
          const statusMap: Record<string, "active" | "trialing" | "past_due" | "cancelled"> = {
            active: "active",
            trialing: "trialing",
            past_due: "past_due",
            canceled: "cancelled",
            unpaid: "past_due",
            incomplete: "past_due",
            incomplete_expired: "cancelled",
            paused: "past_due",
          };

          const period = extractBillingPeriod(subscription as unknown as Record<string, unknown>);
          const mappedStatus = statusMap[subscription.status];
          if (!mappedStatus) {
            console.warn(`Stripe status desconhecido: ${subscription.status}`);
          }

          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              status: mappedStatus ?? "past_due",
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodStart: period.currentPeriodStart,
              currentPeriodEnd: period.currentPeriodEnd,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;

        const existingSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId },
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: { status: "cancelled" },
          });

          await prisma.tenant.update({
            where: { id: existingSub.tenantId },
            data: { status: "suspended" },
          });
        }
        break;
      }

      default:
        console.log(`Evento Stripe não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook Stripe:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
