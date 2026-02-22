export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createCommunicationPlanSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "communicationPlan", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;

    const plans = await ctx.db.communicationPlan.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(plans);
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
    requirePermission(ctx, "communicationPlan", "create");

    const body = await request.json();
    const data = createCommunicationPlanSchema.parse(body);

    const plan = await ctx.db.communicationPlan.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        topic: data.topic,
        audience: data.audience,
        frequency: data.frequency,
        method: data.method,
        responsibleId: data.responsibleId || null,
        notes: data.notes || null,
      },
    });

    return successResponse(plan, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
