export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { markNotificationsSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url);
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = { tenantId: ctx.tenantId, userId: ctx.userId };

    const [items, total, unreadCount] = await Promise.all([
      ctx.db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      ctx.db.notification.count({ where }),
      ctx.db.notification.count({ where: { ...where, readAt: null } }),
    ]);

    return paginatedResponse(
      items.map((n) => ({ ...n, unreadCount })),
      total,
      page,
      pageSize
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);

    const body = await request.json();
    const { ids, all } = markNotificationsSchema.parse(body);

    if (all) {
      await ctx.db.notification.updateMany({
        where: { userId: ctx.userId, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (ids?.length) {
      await ctx.db.notification.updateMany({
        where: { id: { in: ids }, userId: ctx.userId },
        data: { readAt: new Date() },
      });
    }

    return successResponse({ marked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
