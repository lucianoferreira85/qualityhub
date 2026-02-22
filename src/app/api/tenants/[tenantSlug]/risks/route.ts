export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";

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
