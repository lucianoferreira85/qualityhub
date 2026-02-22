export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateIncidentActionSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; incidentId: string; actionId: string }> }
) {
  try {
    const { tenantSlug, actionId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityIncident", "update");

    const existing = await ctx.db.incidentAction.findFirst({
      where: { id: actionId },
    });
    if (!existing) throw new NotFoundError("Ação do Incidente");

    const body = await request.json();
    const data = updateIncidentActionSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.status === "completed" && existing.status !== "completed") {
      updateData.completedAt = new Date();
    }

    const action = await ctx.db.incidentAction.update({
      where: { id: actionId },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
      },
    });

    return successResponse(action);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; incidentId: string; actionId: string }> }
) {
  try {
    const { tenantSlug, actionId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityIncident", "delete");

    const existing = await ctx.db.incidentAction.findFirst({
      where: { id: actionId },
    });
    if (!existing) throw new NotFoundError("Ação do Incidente");

    await ctx.db.incidentAction.delete({
      where: { id: actionId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
