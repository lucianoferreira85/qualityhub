export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateContextSchema } from "@/lib/validations";
import { logActivity, getClientIp } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "context", "update");

    const existing = await ctx.db.organizationContext.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Contexto");

    const body = await request.json();
    const data = updateContextSchema.parse(body);

    const updated = await ctx.db.organizationContext.update({
      where: { id },
      data,
    });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "update",
      entityType: "organizationContext",
      entityId: id,
      metadata: { title: updated.title },
      ipAddress: getClientIp(request),
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "context", "delete");

    const existing = await ctx.db.organizationContext.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Contexto");

    await ctx.db.organizationContext.delete({ where: { id } });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "delete",
      entityType: "organizationContext",
      entityId: id,
      metadata: { title: existing.title },
      ipAddress: getClientIp(request),
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
