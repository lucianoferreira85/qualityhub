export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateIncidentSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; incidentId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, incidentId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityIncident", "update");

    const existing = await ctx.db.securityIncident.findFirst({
      where: { id: incidentId, projectId },
    });
    if (!existing) throw new NotFoundError("Incidente de Segurança");

    const body = await request.json();
    const data = updateIncidentSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "resolved" && existing.status !== "resolved") {
      updateData.resolvedAt = new Date();
    }
    if (data.status === "closed" && existing.status !== "closed") {
      updateData.closedAt = new Date();
    }

    const incident = await ctx.db.securityIncident.update({
      where: { id: incidentId },
      data: updateData,
      include: {
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    });

    return successResponse(incident);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; incidentId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, incidentId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityIncident", "delete");

    const existing = await ctx.db.securityIncident.findFirst({
      where: { id: incidentId, projectId },
    });
    if (!existing) throw new NotFoundError("Incidente de Segurança");

    await ctx.db.securityIncident.delete({
      where: { id: incidentId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
