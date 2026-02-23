export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError, ValidationError } from "@/lib/api-helpers";
import { updatePolicySchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; policyId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, policyId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "policy", "update");

    const existing = await ctx.db.policy.findFirst({
      where: { id: policyId, projectId },
    });
    if (!existing) throw new NotFoundError("Política");

    const body = await request.json();
    const data = updatePolicySchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.nextReviewDate) updateData.nextReviewDate = new Date(data.nextReviewDate);

    // Status transitions
    if (data.status === "in_review" && existing.status === "draft") {
      if (!data.reviewerId && !existing.reviewerId) {
        throw new ValidationError({ reviewerId: ["Revisor é obrigatório para enviar à revisão"] });
      }
    }
    if (data.status === "approved" && existing.status === "in_review") {
      updateData.approverId = ctx.userId;
      updateData.approvedAt = new Date();
    }
    if (data.status === "published" && existing.status === "approved") {
      updateData.publishedAt = new Date();
    }

    const policy = await ctx.db.policy.update({
      where: { id: policyId },
      data: updateData,
      include: {
        author: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        acknowledgments: { select: { id: true, userId: true } },
      },
    });

    return successResponse(policy);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; policyId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, policyId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "policy", "delete");

    const existing = await ctx.db.policy.findFirst({
      where: { id: policyId, projectId },
    });
    if (!existing) throw new NotFoundError("Política");

    await ctx.db.policy.delete({
      where: { id: policyId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
