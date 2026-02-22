export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateParticipantSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; campaignId: string; participantId: string }> }
) {
  try {
    const { tenantSlug, campaignId, participantId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "awarenessCampaign", "update");

    const existing = await ctx.db.awarenessParticipant.findFirst({
      where: { id: participantId, campaignId },
    });
    if (!existing) throw new NotFoundError("Participante");

    const body = await request.json();
    const data = updateParticipantSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.completedAt) updateData.completedAt = new Date(data.completedAt);
    if (data.status === "completed" || data.status === "attended") {
      updateData.attended = true;
    }

    const participant = await ctx.db.awarenessParticipant.update({
      where: { id: participantId },
      data: updateData,
    });

    // Recalculate completionRate
    const allParticipants = await ctx.db.awarenessParticipant.findMany({
      where: { campaignId },
    });
    const completedCount = allParticipants.filter((p: { status: string }) => ["completed", "attended"].includes(p.status)).length;
    const completionRate = allParticipants.length > 0 ? (completedCount / allParticipants.length) * 100 : 0;

    await ctx.db.awarenessCampaign.update({
      where: { id: campaignId },
      data: { completionRate },
    });

    return successResponse(participant);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; campaignId: string; participantId: string }> }
) {
  try {
    const { tenantSlug, campaignId, participantId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "awarenessCampaign", "delete");

    const existing = await ctx.db.awarenessParticipant.findFirst({
      where: { id: participantId, campaignId },
    });
    if (!existing) throw new NotFoundError("Participante");

    await ctx.db.awarenessParticipant.delete({
      where: { id: participantId },
    });

    // Recalculate completionRate
    const allParticipants = await ctx.db.awarenessParticipant.findMany({
      where: { campaignId },
    });
    const completedCount = allParticipants.filter((p: { status: string }) => ["completed", "attended"].includes(p.status)).length;
    const completionRate = allParticipants.length > 0 ? (completedCount / allParticipants.length) * 100 : 0;

    await ctx.db.awarenessCampaign.update({
      where: { id: campaignId },
      data: { completionRate },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
