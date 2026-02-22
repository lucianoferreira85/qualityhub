export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; policyId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, policyId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "policy", "read");

    const policy = await ctx.db.policy.findFirst({
      where: { id: policyId, projectId },
    });
    if (!policy) throw new NotFoundError("Política");

    const acknowledgment = await ctx.db.policyAcknowledgment.upsert({
      where: {
        policyId_userId: {
          policyId,
          userId: ctx.userId,
        },
      },
      update: {
        acknowledgedAt: new Date(),
      },
      create: {
        tenantId: ctx.tenantId,
        policyId,
        userId: ctx.userId,
      },
    });

    return successResponse(acknowledgment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
