export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateNonconformitySchema } from "@/lib/validations";

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

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
