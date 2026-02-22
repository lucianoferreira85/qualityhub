export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateCompetenceSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; competenceId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, competenceId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "competence", "update");

    const existing = await ctx.db.competence.findFirst({
      where: { id: competenceId, projectId },
    });
    if (!existing) throw new NotFoundError("Competência");

    const body = await request.json();
    const data = updateCompetenceSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.completedAt) updateData.completedAt = new Date(data.completedAt);

    const competence = await ctx.db.competence.update({
      where: { id: competenceId },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
      },
    });

    return successResponse(competence);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; competenceId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, competenceId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "competence", "delete");

    const existing = await ctx.db.competence.findFirst({
      where: { id: competenceId, projectId },
    });
    if (!existing) throw new NotFoundError("Competência");

    await ctx.db.competence.delete({
      where: { id: competenceId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
