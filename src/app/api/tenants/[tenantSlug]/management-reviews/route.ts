export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, requireFeature, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { createManagementReviewSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "managementReview", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const projectId = url.searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const pagination = parsePaginationParams(url);

    if (pagination) {
      const [items, total] = await Promise.all([
        ctx.db.managementReview.findMany({
          where,
          include: {
            project: { select: { id: true, name: true } },
          },
          orderBy: { scheduledDate: "desc" },
          skip: pagination.skip,
          take: pagination.pageSize,
        }),
        ctx.db.managementReview.count({ where }),
      ]);
      return paginatedResponse(items, total, pagination.page, pagination.pageSize);
    }

    const reviews = await ctx.db.managementReview.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { scheduledDate: "desc" },
    });

    return successResponse(reviews);
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
    requirePermission(ctx, "managementReview", "create");
    await requireFeature(ctx.tenantId, "managementReview");

    const body = await request.json();
    const data = createManagementReviewSchema.parse(body);

    const review = await ctx.db.managementReview.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: data.projectId,
        scheduledDate: new Date(data.scheduledDate),
        minutes: data.minutes,
        decisions: data.decisions || [],
      },
    });

    return successResponse(review, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
