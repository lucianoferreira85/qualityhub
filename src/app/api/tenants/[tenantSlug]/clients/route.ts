export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, PlanLimitError, parsePaginationParams, paginatedResponse } from "@/lib/api-helpers";
import { createClientSchema } from "@/lib/validations";
import { checkPlanLimit } from "@/lib/plan-limits";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "client", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const pagination = parsePaginationParams(url);

    if (pagination) {
      const [items, total] = await Promise.all([
        ctx.db.consultingClient.findMany({
          where,
          orderBy: { name: "asc" },
          skip: pagination.skip,
          take: pagination.pageSize,
        }),
        ctx.db.consultingClient.count({ where }),
      ]);
      return paginatedResponse(items, total, pagination.page, pagination.pageSize);
    }

    const clients = await ctx.db.consultingClient.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return successResponse(clients);
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
    requirePermission(ctx, "client", "create");

    const body = await request.json();
    const data = createClientSchema.parse(body);

    const limit = await checkPlanLimit(ctx.tenantId, "clients");
    if (!limit.allowed) {
      throw new PlanLimitError("clients", limit.current, limit.limit);
    }

    const client = await ctx.db.consultingClient.create({
      data: {
        tenantId: ctx.tenantId,
        ...data,
      },
    });

    return successResponse(client, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
