export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createCheckoutSession, type PlanSlug } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "billing", "update");

    const body = await request.json();
    const { planSlug } = checkoutSchema.parse(body) as { planSlug: PlanSlug };

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const customerEmail = user?.email || "";

    const origin = new URL(request.url).origin;
    const session = await createCheckoutSession({
      tenantId: ctx.tenantId,
      planSlug,
      customerEmail,
      successUrl: `${origin}/${tenantSlug}/settings/billing?status=success`,
      cancelUrl: `${origin}/${tenantSlug}/settings/billing?status=cancelled`,
    });

    return successResponse({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
