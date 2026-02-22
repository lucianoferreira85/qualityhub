export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { createProcessSchema } from "@/lib/validations";
import { generateCode } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "process", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const projectId = url.searchParams.get("projectId");
    const category = url.searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;

    const pagination = parsePaginationParams(url);

    if (pagination) {
      const [items, total] = await Promise.all([
        ctx.db.process.findMany({
          where,
          include: {
            project: { select: { id: true, name: true } },
            responsible: { select: { id: true, name: true } },
            _count: { select: { indicators: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.pageSize,
        }),
        ctx.db.process.count({ where }),
      ]);
      return paginatedResponse(items, total, pagination.page, pagination.pageSize);
    }

    const processes = await ctx.db.process.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        _count: { select: { indicators: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(processes);
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
    requirePermission(ctx, "process", "create");

    const body = await request.json();
    const data = createProcessSchema.parse(body);

    const count = await ctx.db.process.count();
    const code = generateCode("PRC", count + 1);

    const process = await ctx.db.process.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: data.projectId,
        code,
        name: data.name,
        description: data.description,
        responsibleId: data.responsibleId,
        status: data.status || "active",
        category: data.category,
      },
    });

    return successResponse(process, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
