export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { createAuditSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "audit", "read");

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
        ctx.db.audit.findMany({
          where,
          include: {
            project: { select: { id: true, name: true } },
            leadAuditor: { select: { id: true, name: true } },
            _count: { select: { findings: true } },
          },
          orderBy: { startDate: "desc" },
          skip: pagination.skip,
          take: pagination.pageSize,
        }),
        ctx.db.audit.count({ where }),
      ]);
      return paginatedResponse(items, total, pagination.page, pagination.pageSize);
    }

    const audits = await ctx.db.audit.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        leadAuditor: { select: { id: true, name: true } },
        _count: { select: { findings: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return successResponse(audits);
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
    requirePermission(ctx, "audit", "create");

    const body = await request.json();
    const data = createAuditSchema.parse(body);

    const audit = await ctx.db.audit.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: data.projectId,
        title: data.title,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        leadAuditorId: data.leadAuditorId,
        scope: data.scope,
        notes: data.notes,
      },
    });

    return successResponse(audit, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
