export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateImprovementSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; improvementId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, improvementId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "improvement", "update");

    const existing = await ctx.db.improvementOpportunity.findFirst({
      where: { id: improvementId, projectId },
    });
    if (!existing) throw new NotFoundError("Oportunidade de Melhoria");

    const body = await request.json();
    const data = updateImprovementSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.status === "implemented" && existing.status !== "implemented") {
      updateData.implementedAt = new Date();
    }
    if (data.status === "verified" && existing.status !== "verified") {
      updateData.verifiedAt = new Date();
    }

    const improvement = await ctx.db.improvementOpportunity.update({
      where: { id: improvementId },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
        actionPlan: { select: { id: true, code: true, title: true } },
      },
    });

    return successResponse(improvement);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; improvementId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, improvementId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "improvement", "delete");

    const existing = await ctx.db.improvementOpportunity.findFirst({
      where: { id: improvementId, projectId },
    });
    if (!existing) throw new NotFoundError("Oportunidade de Melhoria");

    await ctx.db.improvementOpportunity.delete({
      where: { id: improvementId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
