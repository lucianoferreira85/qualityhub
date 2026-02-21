export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createActionSchema } from "@/lib/validations";
import { generateCode } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "actionPlan", "read");

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const projectId = url.searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const actions = await ctx.db.actionPlan.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        nonconformity: { select: { id: true, code: true, title: true } },
        risk: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(actions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "actionPlan", "create");

    const body = await request.json();
    const data = createActionSchema.parse(body);

    const count = await ctx.db.actionPlan.count();
    const code = generateCode("AP", count + 1);

    const action = await ctx.db.actionPlan.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: data.projectId,
        code,
        title: data.title,
        description: data.description,
        type: data.type,
        responsibleId: data.responsibleId,
        nonconformityId: data.nonconformityId,
        riskId: data.riskId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    return successResponse(action, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
