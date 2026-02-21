export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateFindingSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; findingId: string }> }
) {
  try {
    const { tenantSlug, id, findingId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "auditFinding", "update");

    const audit = await ctx.db.audit.findFirst({ where: { id } });
    if (!audit) throw new NotFoundError("Auditoria");

    const finding = await ctx.db.auditFinding.findFirst({ where: { id: findingId, auditId: id } });
    if (!finding) throw new NotFoundError("Constatação");

    const body = await request.json();
    const data = updateFindingSchema.parse(body);

    const updated = await ctx.db.auditFinding.update({
      where: { id: findingId },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; findingId: string }> }
) {
  try {
    const { tenantSlug, id, findingId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "auditFinding", "delete");

    const audit = await ctx.db.audit.findFirst({ where: { id } });
    if (!audit) throw new NotFoundError("Auditoria");

    const finding = await ctx.db.auditFinding.findFirst({ where: { id: findingId, auditId: id } });
    if (!finding) throw new NotFoundError("Constatação");

    await ctx.db.auditFinding.delete({ where: { id: findingId } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
