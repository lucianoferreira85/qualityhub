export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateIndicatorSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "indicator", "read");

    const indicator = await ctx.db.indicator.findFirst({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        measurements: {
          orderBy: { period: "desc" },
        },
      },
    });

    if (!indicator) throw new NotFoundError("Indicador");

    return successResponse(indicator);
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
    requirePermission(ctx, "indicator", "update");

    const body = await request.json();
    const data = updateIndicatorSchema.parse(body);

    const indicator = await ctx.db.indicator.findFirst({ where: { id } });
    if (!indicator) throw new NotFoundError("Indicador");

    const updated = await ctx.db.indicator.update({
      where: { id },
      data,
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
    requirePermission(ctx, "indicator", "delete");

    const indicator = await ctx.db.indicator.findFirst({ where: { id } });
    if (!indicator) throw new NotFoundError("Indicador");

    await ctx.db.indicator.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
