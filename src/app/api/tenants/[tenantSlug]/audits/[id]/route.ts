export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateAuditSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "audit", "read");

    const audit = await ctx.db.audit.findFirst({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        leadAuditor: { select: { id: true, name: true, email: true } },
        findings: {
          include: {
            clause: { select: { id: true, code: true, title: true } },
            nonconformity: { select: { id: true, code: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!audit) throw new NotFoundError("Auditoria");

    return successResponse(audit);
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
    requirePermission(ctx, "audit", "update");

    const body = await request.json();
    const data = updateAuditSchema.parse(body);

    const audit = await ctx.db.audit.findFirst({ where: { id } });
    if (!audit) throw new NotFoundError("Auditoria");

    const updated = await ctx.db.audit.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

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
    requirePermission(ctx, "audit", "delete");

    const audit = await ctx.db.audit.findFirst({ where: { id } });
    if (!audit) throw new NotFoundError("Auditoria");

    await ctx.db.audit.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
