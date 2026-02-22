export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createObjectiveSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityObjective", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;
    if (category) where.category = category;

    const objectives = await ctx.db.securityObjective.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
        indicator: { select: { id: true, name: true, unit: true, target: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(objectives);
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
    requirePermission(ctx, "securityObjective", "create");

    const body = await request.json();
    const data = createObjectiveSchema.parse(body);

    const count = await ctx.db.securityObjective.count({ where: { projectId: id } });
    const code = `OBJ-${String(count + 1).padStart(3, "0")}`;

    const objective = await ctx.db.securityObjective.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        targetValue: data.targetValue || null,
        targetUnit: data.targetUnit || null,
        currentValue: data.currentValue || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        indicatorId: data.indicatorId || null,
        responsibleId: data.responsibleId || null,
        measurable: data.measurable ?? true,
        monitoringFrequency: data.monitoringFrequency || null,
        notes: data.notes || null,
      },
    });

    return successResponse(objective, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
