export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateCampaignSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; campaignId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, campaignId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "awarenessCampaign", "update");

    const existing = await ctx.db.awarenessCampaign.findFirst({
      where: { id: campaignId, projectId },
    });
    if (!existing) throw new NotFoundError("Campanha");

    const body = await request.json();
    const data = updateCampaignSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const campaign = await ctx.db.awarenessCampaign.update({
      where: { id: campaignId },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    });

    return successResponse(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; campaignId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, campaignId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "awarenessCampaign", "delete");

    const existing = await ctx.db.awarenessCampaign.findFirst({
      where: { id: campaignId, projectId },
    });
    if (!existing) throw new NotFoundError("Campanha");

    await ctx.db.awarenessCampaign.delete({
      where: { id: campaignId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
