export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { createIndicatorSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "indicator", "read");

    const url = new URL(request.url);
    const frequency = url.searchParams.get("frequency");
    const projectId = url.searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (frequency) where.frequency = frequency;
    if (projectId) where.projectId = projectId;

    const pagination = parsePaginationParams(url);

    if (pagination) {
      const [items, total] = await Promise.all([
        ctx.db.indicator.findMany({
          where,
          include: {
            project: { select: { id: true, name: true } },
            measurements: {
              orderBy: { period: "desc" },
              take: 12,
            },
          },
          orderBy: { name: "asc" },
          skip: pagination.skip,
          take: pagination.pageSize,
        }),
        ctx.db.indicator.count({ where }),
      ]);
      return paginatedResponse(items, total, pagination.page, pagination.pageSize);
    }

    const indicators = await ctx.db.indicator.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        measurements: {
          orderBy: { period: "desc" },
          take: 12,
        },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(indicators);
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
    requirePermission(ctx, "indicator", "create");

    const body = await request.json();
    const data = createIndicatorSchema.parse(body);

    const indicator = await ctx.db.indicator.create({
      data: {
        tenantId: ctx.tenantId,
        name: data.name,
        description: data.description,
        unit: data.unit,
        frequency: data.frequency,
        target: data.target,
        lowerLimit: data.lowerLimit,
        upperLimit: data.upperLimit,
        projectId: data.projectId,
      },
    });

    return successResponse(indicator, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
