export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, requirePermission, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "settings", "read");

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const action = url.searchParams.get("action");
    const entityType = url.searchParams.get("entityType");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const where: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }

    const pagination = parsePaginationParams(url);
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginatedResponse(items, total, page, pageSize);
  } catch (error) {
    return handleApiError(error);
  }
}
