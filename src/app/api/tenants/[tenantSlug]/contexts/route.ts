export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createContextSchema } from "@/lib/validations";
import { logActivity, getClientIp } from "@/lib/audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "context", "read");

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (category) where.category = category;

    const contexts = await ctx.db.organizationContext.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return successResponse(contexts);
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
    requirePermission(ctx, "context", "create");

    const body = await request.json();
    const data = createContextSchema.parse(body);

    const context = await ctx.db.organizationContext.create({
      data: {
        ...data,
        tenantId: ctx.tenantId,
      },
    });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "create",
      entityType: "organizationContext",
      entityId: context.id,
      metadata: { title: data.title, type: data.type },
      ipAddress: getClientIp(request),
    });

    return successResponse(context, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
