export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateNonconformitySchema } from "@/lib/validations";
import { logActivity, getClientIp } from "@/lib/audit-log";
import { triggerNcAssigned } from "@/lib/email-triggers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "nonconformity", "read");

    const nc = await ctx.db.nonconformity.findFirst({
      where: { id },
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        clause: true,
        rootCause: true,
        actionPlans: {
          include: { responsible: { select: { id: true, name: true } } },
        },
      },
    });

    if (!nc) throw new NotFoundError("Não conformidade");

    return successResponse(nc);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "nonconformity", "update");

    const body = await request.json();
    const data = updateNonconformitySchema.parse(body);

    const nc = await ctx.db.nonconformity.findFirst({ where: { id } });
    if (!nc) throw new NotFoundError("Não conformidade");

    const updated = await ctx.db.nonconformity.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        closedAt: data.status === "closed" ? new Date() : undefined,
      },
    });

    const logAction = data.status && data.status !== nc.status ? "status_change" : "update";
    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: logAction,
      entityType: "nonconformity",
      entityId: id,
      metadata: { changes: data, previousStatus: nc.status },
      ipAddress: getClientIp(request),
    });

    if (data.responsibleId && data.responsibleId !== nc.responsibleId) {
      triggerNcAssigned({
        tenantId: ctx.tenantId,
        tenantSlug,
        responsibleId: data.responsibleId,
        ncId: id,
        ncCode: nc.code,
        ncTitle: nc.title,
        severity: nc.severity,
      });
    }

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "nonconformity", "delete");

    const nc = await ctx.db.nonconformity.findFirst({ where: { id } });
    if (!nc) throw new NotFoundError("Não conformidade");

    await ctx.db.nonconformity.delete({ where: { id } });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "delete",
      entityType: "nonconformity",
      entityId: id,
      metadata: { code: nc.code, title: nc.title },
      ipAddress: getClientIp(_request),
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
