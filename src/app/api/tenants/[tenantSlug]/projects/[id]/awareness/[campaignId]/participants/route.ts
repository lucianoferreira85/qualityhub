export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { addParticipantSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; campaignId: string }> }
) {
  try {
    const { tenantSlug, campaignId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "awarenessCampaign", "read");

    const participants = await ctx.db.awarenessParticipant.findMany({
      where: { campaignId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(participants);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; campaignId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, campaignId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "awarenessCampaign", "create");

    const campaign = await ctx.db.awarenessCampaign.findFirst({
      where: { id: campaignId, projectId },
    });
    if (!campaign) throw new NotFoundError("Campanha");

    const body = await request.json();
    const data = addParticipantSchema.parse(body);

    const participant = await ctx.db.awarenessParticipant.create({
      data: {
        tenantId: ctx.tenantId,
        campaignId,
        userId: data.userId || null,
        externalName: data.externalName || null,
        externalEmail: data.externalEmail || null,
      },
    });

    return successResponse(participant, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
