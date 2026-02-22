export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { createActionSchema } from "@/lib/validations";
import { generateCode } from "@/lib/utils";
import { logActivity, getClientIp } from "@/lib/audit-log";
import { triggerActionAssigned } from "@/lib/email-triggers";

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

    const pagination = parsePaginationParams(url);

    if (pagination) {
      const [items, total] = await Promise.all([
        ctx.db.actionPlan.findMany({
          where,
          include: {
            project: { select: { id: true, name: true } },
            responsible: { select: { id: true, name: true } },
            nonconformity: { select: { id: true, code: true, title: true } },
            risk: { select: { id: true, code: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.pageSize,
        }),
        ctx.db.actionPlan.count({ where }),
      ]);
      return paginatedResponse(items, total, pagination.page, pagination.pageSize);
    }

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

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "create",
      entityType: "actionPlan",
      entityId: action.id,
      metadata: { code, title: data.title, type: data.type },
      ipAddress: getClientIp(request),
    });

    if (data.responsibleId) {
      triggerActionAssigned({
        tenantId: ctx.tenantId,
        tenantSlug,
        responsibleId: data.responsibleId,
        actionId: action.id,
        actionCode: code,
        actionTitle: data.title,
        actionType: data.type,
      });
    }

    return successResponse(action, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
