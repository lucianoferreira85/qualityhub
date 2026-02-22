export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateCommunicationPlanSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; planId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, planId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "communicationPlan", "update");

    const existing = await ctx.db.communicationPlan.findFirst({
      where: { id: planId, projectId },
    });
    if (!existing) throw new NotFoundError("Plano de comunicação");

    const body = await request.json();
    const data = updateCommunicationPlanSchema.parse(body);

    const plan = await ctx.db.communicationPlan.update({
      where: { id: planId },
      data,
      include: {
        responsible: { select: { id: true, name: true } },
      },
    });

    return successResponse(plan);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; planId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, planId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "communicationPlan", "delete");

    const existing = await ctx.db.communicationPlan.findFirst({
      where: { id: planId, projectId },
    });
    if (!existing) throw new NotFoundError("Plano de comunicação");

    await ctx.db.communicationPlan.delete({
      where: { id: planId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
