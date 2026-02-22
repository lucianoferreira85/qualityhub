export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateSupplierSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; supplierId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, supplierId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "supplier", "update");

    const existing = await ctx.db.supplier.findFirst({
      where: { id: supplierId, projectId },
    });
    if (!existing) throw new NotFoundError("Fornecedor");

    const body = await request.json();
    const data = updateSupplierSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.contractStartDate) updateData.contractStartDate = new Date(data.contractStartDate);
    if (data.contractEndDate) updateData.contractEndDate = new Date(data.contractEndDate);
    if (data.nextAssessmentDate) updateData.nextAssessmentDate = new Date(data.nextAssessmentDate);

    const supplier = await ctx.db.supplier.update({
      where: { id: supplierId },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
        _count: { select: { assessments: true } },
      },
    });

    return successResponse(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; supplierId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, supplierId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "supplier", "delete");

    const existing = await ctx.db.supplier.findFirst({
      where: { id: supplierId, projectId },
    });
    if (!existing) throw new NotFoundError("Fornecedor");

    await ctx.db.supplier.delete({
      where: { id: supplierId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
