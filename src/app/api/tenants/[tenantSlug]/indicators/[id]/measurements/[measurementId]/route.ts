export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateMeasurementSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; measurementId: string }> }
) {
  try {
    const { tenantSlug, id, measurementId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "indicator", "update");

    const indicator = await ctx.db.indicator.findFirst({ where: { id } });
    if (!indicator) throw new NotFoundError("Indicador");

    const measurement = await ctx.db.indicatorMeasurement.findFirst({
      where: { id: measurementId, indicatorId: id },
    });
    if (!measurement) throw new NotFoundError("Medição");

    const body = await request.json();
    const data = updateMeasurementSchema.parse(body);

    const updated = await ctx.db.indicatorMeasurement.update({
      where: { id: measurementId },
      data: {
        ...(data.value !== undefined && { value: data.value }),
        ...(data.period && { period: new Date(data.period) }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; measurementId: string }> }
) {
  try {
    const { tenantSlug, id, measurementId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "indicator", "delete");

    const indicator = await ctx.db.indicator.findFirst({ where: { id } });
    if (!indicator) throw new NotFoundError("Indicador");

    const measurement = await ctx.db.indicatorMeasurement.findFirst({
      where: { id: measurementId, indicatorId: id },
    });
    if (!measurement) throw new NotFoundError("Medição");

    await ctx.db.indicatorMeasurement.delete({ where: { id: measurementId } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
