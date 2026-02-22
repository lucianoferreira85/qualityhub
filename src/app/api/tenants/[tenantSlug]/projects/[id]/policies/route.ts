export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createPolicySchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "policy", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;
    if (category) where.category = category;

    const policies = await ctx.db.policy.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        acknowledgments: { select: { id: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(policies);
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
    requirePermission(ctx, "policy", "create");

    const body = await request.json();
    const data = createPolicySchema.parse(body);

    const count = await ctx.db.policy.count({ where: { projectId: id } });
    const code = `POL-${String(count + 1).padStart(3, "0")}`;

    const policy = await ctx.db.policy.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        title: data.title,
        description: data.description || null,
        content: data.content || null,
        category: data.category || null,
        version: "1.0",
        authorId: ctx.userId,
        reviewerId: data.reviewerId || null,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : null,
        notes: data.notes || null,
      },
    });

    return successResponse(policy, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
