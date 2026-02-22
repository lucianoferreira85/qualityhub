export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateChangeRequestSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; changeId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, changeId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "changeRequest", "update");

    const existing = await ctx.db.changeRequest.findFirst({
      where: { id: changeId, projectId },
    });
    if (!existing) throw new NotFoundError("Solicitação de Mudança");

    const body = await request.json();
    const data = updateChangeRequestSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.plannedDate) updateData.plannedDate = new Date(data.plannedDate);

    // Workflow timestamps
    if (data.status === "approved" && existing.status !== "approved") {
      updateData.approvedAt = new Date();
      updateData.approvedById = ctx.userId;
    }
    if (data.status === "implemented" && existing.status !== "implemented") {
      updateData.implementedAt = new Date();
    }
    if (data.status === "verified" && existing.status !== "verified") {
      updateData.verifiedAt = new Date();
    }
    if (data.status === "rejected" && existing.status !== "rejected") {
      updateData.rejectedAt = new Date();
    }

    const change = await ctx.db.changeRequest.update({
      where: { id: changeId },
      data: updateData,
      include: {
        requestedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    return successResponse(change);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; changeId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, changeId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "changeRequest", "delete");

    const existing = await ctx.db.changeRequest.findFirst({
      where: { id: changeId, projectId },
    });
    if (!existing) throw new NotFoundError("Solicitação de Mudança");

    await ctx.db.changeRequest.delete({
      where: { id: changeId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
