export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createCampaignSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "awarenessCampaign", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;
    if (type) where.type = type;

    const campaigns = await ctx.db.awarenessCampaign.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(campaigns);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "awarenessCampaign", "create");

    const body = await request.json();
    const data = createCampaignSchema.parse(body);

    const count = await ctx.db.awarenessCampaign.count({ where: { projectId: id } });
    const code = `AWR-${String(count + 1).padStart(3, "0")}`;

    const campaign = await ctx.db.awarenessCampaign.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        title: data.title,
        description: data.description || null,
        type: data.type,
        targetAudience: data.targetAudience || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        duration: data.duration || null,
        location: data.location || null,
        instructor: data.instructor || null,
        materials: data.materials || null,
        responsibleId: data.responsibleId || null,
        notes: data.notes || null,
      },
    });

    return successResponse(campaign, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
