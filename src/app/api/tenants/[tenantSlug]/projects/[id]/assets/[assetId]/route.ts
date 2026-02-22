export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateAssetSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; assetId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, assetId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "informationAsset", "update");

    const existing = await ctx.db.informationAsset.findFirst({
      where: { id: assetId, projectId },
    });
    if (!existing) throw new NotFoundError("Ativo de Informação");

    const body = await request.json();
    const data = updateAssetSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.acquisitionDate) updateData.acquisitionDate = new Date(data.acquisitionDate);
    if (data.endOfLifeDate) updateData.endOfLifeDate = new Date(data.endOfLifeDate);
    if (data.lastReviewDate) updateData.lastReviewDate = new Date(data.lastReviewDate);
    if (data.nextReviewDate) updateData.nextReviewDate = new Date(data.nextReviewDate);

    const asset = await ctx.db.informationAsset.update({
      where: { id: assetId },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
      },
    });

    return successResponse(asset);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; assetId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, assetId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "informationAsset", "delete");

    const existing = await ctx.db.informationAsset.findFirst({
      where: { id: assetId, projectId },
    });
    if (!existing) throw new NotFoundError("Ativo de Informação");

    await ctx.db.informationAsset.delete({
      where: { id: assetId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
