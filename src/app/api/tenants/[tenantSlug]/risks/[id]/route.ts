export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateRiskSchema } from "@/lib/validations";
import { getRiskLevel } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "read");

    const risk = await ctx.db.risk.findFirst({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        treatments: {
          include: { control: { select: { id: true, code: true, title: true } } },
          orderBy: { createdAt: "desc" },
        },
        actionPlans: {
          include: { responsible: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!risk) throw new NotFoundError("Risco");

    return successResponse(risk);
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
    requirePermission(ctx, "risk", "update");

    const body = await request.json();
    const data = updateRiskSchema.parse(body);

    const existing = await ctx.db.risk.findFirst({ where: { id } });
    if (!existing) throw new NotFoundError("Risco");

    const probability = data.probability ?? existing.probability;
    const impact = data.impact ?? existing.impact;
    const riskLevel = (data.probability !== undefined || data.impact !== undefined)
      ? getRiskLevel(probability, impact)
      : undefined;

    const updated = await ctx.db.risk.update({
      where: { id },
      data: {
        ...data,
        ...(riskLevel ? { riskLevel } : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
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
    requirePermission(ctx, "risk", "delete");

    const risk = await ctx.db.risk.findFirst({ where: { id } });
    if (!risk) throw new NotFoundError("Risco");

    await ctx.db.risk.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
