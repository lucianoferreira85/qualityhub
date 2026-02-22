export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateSupplierAssessmentSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; supplierId: string; assessmentId: string }> }
) {
  try {
    const { tenantSlug, assessmentId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "supplier", "update");

    const existing = await ctx.db.supplierAssessment.findFirst({
      where: { id: assessmentId },
    });
    if (!existing) throw new NotFoundError("Avaliação do Fornecedor");

    const body = await request.json();
    const data = updateSupplierAssessmentSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.assessmentDate) updateData.assessmentDate = new Date(data.assessmentDate);
    if (data.nextAssessmentDate) updateData.nextAssessmentDate = new Date(data.nextAssessmentDate);

    const assessment = await ctx.db.supplierAssessment.update({
      where: { id: assessmentId },
      data: updateData,
      include: {
        assessor: { select: { id: true, name: true } },
      },
    });

    return successResponse(assessment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; supplierId: string; assessmentId: string }> }
) {
  try {
    const { tenantSlug, assessmentId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "supplier", "delete");

    const existing = await ctx.db.supplierAssessment.findFirst({
      where: { id: assessmentId },
    });
    if (!existing) throw new NotFoundError("Avaliação do Fornecedor");

    await ctx.db.supplierAssessment.delete({
      where: { id: assessmentId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
