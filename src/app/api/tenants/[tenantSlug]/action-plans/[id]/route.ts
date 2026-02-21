export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateActionSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "actionPlan", "read");

    const action = await ctx.db.actionPlan.findFirst({
      where: { id },
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        nonconformity: { select: { id: true, code: true, title: true } },
        risk: { select: { id: true, code: true, title: true } },
      },
    });

    if (!action) throw new NotFoundError("Plano de ação");

    return successResponse(action);
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
    requirePermission(ctx, "actionPlan", "update");

    const body = await request.json();
    const data = updateActionSchema.parse(body);

    const action = await ctx.db.actionPlan.findFirst({ where: { id } });
    if (!action) throw new NotFoundError("Plano de ação");

    const updated = await ctx.db.actionPlan.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt: data.status === "completed" ? new Date() : undefined,
        verifiedAt: data.status === "verified" ? new Date() : undefined,
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
    requirePermission(ctx, "actionPlan", "delete");

    const action = await ctx.db.actionPlan.findFirst({ where: { id } });
    if (!action) throw new NotFoundError("Plano de ação");

    await ctx.db.actionPlan.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
