import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

export function getPlanPriceIds() {
  return {
    starter: process.env.STRIPE_STARTER_PRICE_ID!,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  } as const;
}

export type PlanSlug = "starter" | "professional" | "enterprise";

export async function createCheckoutSession({
  tenantId,
  planSlug,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  tenantId: string;
  planSlug: PlanSlug;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const priceIds = getPlanPriceIds();
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [
      {
        price: priceIds[planSlug],
        quantity: 1,
      },
    ],
    metadata: { tenantId, planSlug },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}
