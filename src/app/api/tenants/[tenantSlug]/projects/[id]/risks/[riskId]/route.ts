export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateRiskSchema } from "@/lib/validations";
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
      include: {
        responsible: { select: { id: true, name: true } },
        treatments: {
          include: {
            control: { select: { id: true, code: true, title: true } },
            projectControl: { select: { id: true, controlId: true, control: { select: { id: true, code: true, title: true } } } },
          },
          orderBy: { createdAt: "asc" },
        },
        history: {
          include: {
            reviewedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
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
  { params }: { params: Promise<{ tenantSlug: string; id: string; riskId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, riskId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "update");

    const existing = await ctx.db.risk.findFirst({
      where: { id: riskId, projectId },
    });
    if (!existing) throw new NotFoundError("Risco");

    const body = await request.json();
    const data = updateRiskSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };

    // Recalculate risk level if probability or impact changed
    const newProb = data.probability ?? existing.probability;
    const newImpact = data.impact ?? existing.impact;
    if (data.probability || data.impact) {
      updateData.riskLevel = getRiskLevel(newProb, newImpact);
    }

    // Convert date strings
    if (data.nextReviewDate) {
      updateData.nextReviewDate = new Date(data.nextReviewDate);
    }

    // If prob/impact changed, create a history snapshot
    const probChanged = data.probability && data.probability !== existing.probability;
    const impactChanged = data.impact && data.impact !== existing.impact;
    if (probChanged || impactChanged) {
      await ctx.db.riskHistory.create({
        data: {
          riskId,
          probability: newProb,
          impact: newImpact,
          riskLevel: getRiskLevel(newProb, newImpact),
          residualProbability: data.residualProbability ?? existing.residualProbability,
          residualImpact: data.residualImpact ?? existing.residualImpact,
          status: data.status ?? existing.status,
          reviewNotes: data.reviewNotes || null,
          reviewedById: ctx.userId,
        },
      });
      updateData.lastReviewDate = new Date();
    }

    const risk = await ctx.db.risk.update({
      where: { id: riskId },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
        treatments: true,
      },
    });

    return successResponse(risk);
  } catch (error) {
    return handleApiError(error);
  }
}
