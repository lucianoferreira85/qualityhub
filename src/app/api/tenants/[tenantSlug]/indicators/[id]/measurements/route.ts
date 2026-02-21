export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { createMeasurementSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "indicator", "read");

    const indicator = await ctx.db.indicator.findFirst({ where: { id } });
    if (!indicator) throw new NotFoundError("Indicador");

    const measurements = await ctx.db.indicatorMeasurement.findMany({
      where: { indicatorId: id },
      orderBy: { period: "desc" },
    });

    return successResponse(measurements);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "indicator", "create");

    const indicator = await ctx.db.indicator.findFirst({ where: { id } });
    if (!indicator) throw new NotFoundError("Indicador");

    const body = await request.json();
    const data = createMeasurementSchema.parse(body);

    const measurement = await ctx.db.indicatorMeasurement.create({
      data: {
        tenantId: ctx.tenantId,
        indicatorId: id,
        value: data.value,
        period: new Date(data.period),
        notes: data.notes,
      },
    });

    return successResponse(measurement, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
