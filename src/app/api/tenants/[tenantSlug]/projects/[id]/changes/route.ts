export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createChangeRequestSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "changeRequest", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;

    const changes = await ctx.db.changeRequest.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(changes);
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
    requirePermission(ctx, "changeRequest", "create");

    const body = await request.json();
    const data = createChangeRequestSchema.parse(body);

    const count = await ctx.db.changeRequest.count({ where: { projectId: id } });
    const code = `CHG-${String(count + 1).padStart(3, "0")}`;

    const change = await ctx.db.changeRequest.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        title: data.title,
        description: data.description || null,
        type: data.type,
        reason: data.reason || null,
        impactAnalysis: data.impactAnalysis || null,
        riskAssessment: data.riskAssessment || null,
        rollbackPlan: data.rollbackPlan || null,
        priority: data.priority || "medium",
        requestedById: ctx.userId,
        assignedToId: data.assignedToId || null,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
        affectedAreas: data.affectedAreas || null,
        notes: data.notes || null,
      },
    });

    return successResponse(change, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
