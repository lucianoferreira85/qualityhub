export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateInterestedPartySchema } from "@/lib/validations";
import { logActivity, getClientIp } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "interestedParty", "update");

    const existing = await ctx.db.interestedParty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Parte interessada");

    const body = await request.json();
    const data = updateInterestedPartySchema.parse(body);

    const updated = await ctx.db.interestedParty.update({
      where: { id },
      data,
    });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "update",
      entityType: "interestedParty",
      entityId: id,
      metadata: { name: updated.name },
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
    requirePermission(ctx, "interestedParty", "delete");

    const existing = await ctx.db.interestedParty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Parte interessada");

    await ctx.db.interestedParty.delete({ where: { id } });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "delete",
      entityType: "interestedParty",
      entityId: id,
      metadata: { name: existing.name },
      ipAddress: getClientIp(request),
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
