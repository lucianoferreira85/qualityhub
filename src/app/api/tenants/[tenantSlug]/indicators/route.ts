export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createIndicatorSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "indicator", "read");

    const indicators = await ctx.db.indicator.findMany({
      include: {
        project: { select: { id: true, name: true } },
        measurements: {
          orderBy: { period: "desc" },
          take: 12,
        },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(indicators);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "indicator", "create");

    const body = await request.json();
    const data = createIndicatorSchema.parse(body);

    const indicator = await ctx.db.indicator.create({
      data: {
        tenantId: ctx.tenantId,
        name: data.name,
        description: data.description,
        unit: data.unit,
        frequency: data.frequency,
        target: data.target,
        lowerLimit: data.lowerLimit,
        upperLimit: data.upperLimit,
        projectId: data.projectId,
      },
    });

    return successResponse(indicator, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
