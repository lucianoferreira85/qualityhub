export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateSgsiScopeSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; scopeId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, scopeId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "sgsiScope", "read");

    const scope = await ctx.db.sgsiScope.findFirst({
      where: { id: scopeId, projectId },
      include: {
        approvedBy: { select: { id: true, name: true } },
      },
    });

    if (!scope) throw new NotFoundError("Escopo");

    return successResponse(scope);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; scopeId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, scopeId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "sgsiScope", "update");

    const existing = await ctx.db.sgsiScope.findFirst({
      where: { id: scopeId, projectId },
    });
    if (!existing) throw new NotFoundError("Escopo");

    const body = await request.json();
    const data = updateSgsiScopeSchema.parse(body);

    // If status changes to "approved", set approvedById and approvedAt
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "approved" && existing.status !== "approved") {
      updateData.approvedById = ctx.userId;
      updateData.approvedAt = new Date();
    }

    const scope = await ctx.db.sgsiScope.update({
      where: { id: scopeId },
      data: updateData,
      include: {
        approvedBy: { select: { id: true, name: true } },
      },
    });

    return successResponse(scope);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; scopeId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, scopeId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "sgsiScope", "delete");

    const existing = await ctx.db.sgsiScope.findFirst({
      where: { id: scopeId, projectId },
    });
    if (!existing) throw new NotFoundError("Escopo");

    await ctx.db.sgsiScope.delete({
      where: { id: scopeId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
