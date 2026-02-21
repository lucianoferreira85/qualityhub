export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createManagementReviewSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "managementReview", "read");

    const reviews = await ctx.db.managementReview.findMany({
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { scheduledDate: "desc" },
    });

    return successResponse(reviews);
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
    requirePermission(ctx, "managementReview", "create");

    const body = await request.json();
    const data = createManagementReviewSchema.parse(body);

    const review = await ctx.db.managementReview.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: data.projectId,
        scheduledDate: new Date(data.scheduledDate),
        minutes: data.minutes,
        decisions: data.decisions || [],
      },
    });

    return successResponse(review, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
