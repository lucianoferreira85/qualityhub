export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createImprovementSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "improvement", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const source = url.searchParams.get("source");

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (source) where.source = source;

    const improvements = await ctx.db.improvementOpportunity.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
        actionPlan: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(improvements);
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
    requirePermission(ctx, "improvement", "create");

    const body = await request.json();
    const data = createImprovementSchema.parse(body);

    const count = await ctx.db.improvementOpportunity.count({ where: { projectId: id } });
    const code = `IMP-${String(count + 1).padStart(3, "0")}`;

    const improvement = await ctx.db.improvementOpportunity.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        title: data.title,
        description: data.description || null,
        source: data.source,
        category: data.category || null,
        priority: data.priority || "medium",
        expectedImpact: data.expectedImpact || null,
        responsibleId: data.responsibleId || null,
        actionPlanId: data.actionPlanId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
      },
    });

    return successResponse(improvement, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
