export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "billing", "read");

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: ctx.tenantId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}
