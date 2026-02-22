export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateObjectiveSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; objectiveId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, objectiveId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityObjective", "update");

    const existing = await ctx.db.securityObjective.findFirst({
      where: { id: objectiveId, projectId },
    });
    if (!existing) throw new NotFoundError("Objetivo");

    const body = await request.json();
    const data = updateObjectiveSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.deadline) updateData.deadline = new Date(data.deadline);
    if (data.status === "achieved" && existing.status !== "achieved") {
      updateData.achievedAt = new Date();
    }

    const objective = await ctx.db.securityObjective.update({
      where: { id: objectiveId },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
        indicator: { select: { id: true, name: true, unit: true, target: true } },
      },
    });

    return successResponse(objective);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; objectiveId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, objectiveId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityObjective", "delete");

    const existing = await ctx.db.securityObjective.findFirst({
      where: { id: objectiveId, projectId },
    });
    if (!existing) throw new NotFoundError("Objetivo");

    await ctx.db.securityObjective.delete({
      where: { id: objectiveId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
