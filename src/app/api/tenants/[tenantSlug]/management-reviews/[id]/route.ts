export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateManagementReviewSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "managementReview", "read");

    const review = await ctx.db.managementReview.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    if (!review) throw new NotFoundError("Análise Crítica");

    return successResponse(review);
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
    requirePermission(ctx, "managementReview", "update");

    const existing = await ctx.db.managementReview.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Análise Crítica");

    const body = await request.json();
    const data = updateManagementReviewSchema.parse(body);

    const review = await ctx.db.managementReview.update({
      where: { id },
      data: {
        ...(data.scheduledDate && { scheduledDate: new Date(data.scheduledDate) }),
        ...(data.actualDate !== undefined && { actualDate: data.actualDate ? new Date(data.actualDate) : null }),
        ...(data.status && { status: data.status }),
        ...(data.minutes !== undefined && { minutes: data.minutes }),
        ...(data.decisions && { decisions: data.decisions }),
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return successResponse(review);
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
    requirePermission(ctx, "managementReview", "delete");

    const existing = await ctx.db.managementReview.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Análise Crítica");

    await ctx.db.managementReview.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
