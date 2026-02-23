export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { createRiskReviewSchema } from "@/lib/validations";
import { getRiskLevel } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; riskId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, riskId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "read");

    const risk = await ctx.db.risk.findFirst({
      where: { id: riskId, projectId },
    });
    if (!risk) throw new NotFoundError("Risco");

    const history = await ctx.db.riskHistory.findMany({
      where: { riskId },
      include: {
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(history);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; riskId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, riskId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "update");

    const risk = await ctx.db.risk.findFirst({
      where: { id: riskId, projectId },
    });
    if (!risk) throw new NotFoundError("Risco");

    const body = await request.json();
    const data = createRiskReviewSchema.parse(body);

    const riskLevel = getRiskLevel(data.probability, data.impact);

    // Create history entry
    const entry = await ctx.db.riskHistory.create({
      data: {
        tenantId: ctx.tenantId,
        riskId,
        probability: data.probability,
        impact: data.impact,
        riskLevel,
        residualProbability: data.residualProbability ?? null,
        residualImpact: data.residualImpact ?? null,
        status: data.status,
        reviewNotes: data.reviewNotes || null,
        reviewedById: ctx.userId,
      },
      include: {
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    // Update the risk with the new review data
    await ctx.db.risk.update({
      where: { id: riskId },
      data: {
        probability: data.probability,
        impact: data.impact,
        riskLevel,
        residualProbability: data.residualProbability ?? risk.residualProbability,
        residualImpact: data.residualImpact ?? risk.residualImpact,
        status: data.status,
        reviewNotes: data.reviewNotes || risk.reviewNotes,
        lastReviewDate: new Date(),
      },
    });

    return successResponse(entry, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
