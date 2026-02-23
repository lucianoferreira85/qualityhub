export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, requireFeature, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { createRiskSchema } from "@/lib/validations";
import { generateCode, getRiskLevel } from "@/lib/utils";
import { logActivity, getClientIp } from "@/lib/audit-log";
import { triggerRiskCritical } from "@/lib/email-triggers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "read");

    const url = new URL(request.url);
    const riskLevel = url.searchParams.get("riskLevel");
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const projectId = url.searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (riskLevel) where.riskLevel = riskLevel;
    if (status) where.status = status;
    if (category) where.category = category;
    if (projectId) where.projectId = projectId;

    const pagination = parsePaginationParams(url);

    if (pagination) {
      const [items, total] = await Promise.all([
        ctx.db.risk.findMany({
          where,
          include: {
            project: { select: { id: true, name: true } },
            responsible: { select: { id: true, name: true } },
            _count: { select: { treatments: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.pageSize,
        }),
        ctx.db.risk.count({ where }),
      ]);
      return paginatedResponse(items, total, pagination.page, pagination.pageSize);
    }

    const risks = await ctx.db.risk.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        _count: { select: { treatments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(risks);
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
    requirePermission(ctx, "risk", "create");
    await requireFeature(ctx.tenantId, "risks");

    const body = await request.json();
    const data = createRiskSchema.parse(body);

    const count = await ctx.db.risk.count();
    const code = generateCode("RSK", count + 1);
    const riskLevel = getRiskLevel(data.probability, data.impact);

    const risk = await ctx.db.risk.create({
      data: {
        ...data,
        code,
        riskLevel,
        tenantId: ctx.tenantId,
      },
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
      },
    });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "create",
      entityType: "risk",
      entityId: risk.id,
      metadata: { code, title: data.title, riskLevel },
      ipAddress: getClientIp(request),
    });

    if (riskLevel === "very_high") {
      triggerRiskCritical({
        tenantId: ctx.tenantId,
        tenantSlug: ctx.tenantSlug,
        riskId: risk.id,
        riskCode: code,
        riskTitle: data.title,
        riskLevel,
      });
    }

    return successResponse(risk, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
