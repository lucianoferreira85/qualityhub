export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createCustomerPortalSession } from "@/lib/stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "billing", "update");

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription?.stripeCustomerId) {
      return new Response(
        JSON.stringify({ error: "Nenhuma assinatura ativa encontrada" }),
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;
    const session = await createCustomerPortalSession(
      subscription.stripeCustomerId,
      `${origin}/${tenantSlug}/settings/billing`
    );

    return successResponse({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
