export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createRiskSchema } from "@/lib/validations";
import { generateCode, getRiskLevel } from "@/lib/utils";
import { triggerRiskCritical } from "@/lib/email-triggers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "read");

    const risks = await ctx.db.risk.findMany({
      where: { projectId: id },
      include: {
        responsible: { select: { id: true, name: true } },
        treatments: {
          include: {
            projectControl: { select: { id: true, control: { select: { code: true, title: true } } } },
          },
        },
        history: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(risks);
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
    requirePermission(ctx, "risk", "create");

    const body = await request.json();
    const data = createRiskSchema.parse(body);

    const count = await ctx.db.risk.count();
    const code = generateCode("RSK", count + 1);

    const risk = await ctx.db.risk.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        title: data.title,
        description: data.description,
        category: data.category,
        probability: data.probability,
        impact: data.impact,
        riskLevel: getRiskLevel(data.probability, data.impact),
        impactDimensions: data.impactDimensions || {},
        treatment: data.treatment,
        treatmentPlan: data.treatmentPlan,
        responsibleId: data.responsibleId,
      },
    });

    const riskLevel = getRiskLevel(data.probability, data.impact);
    if (riskLevel === "critical" || riskLevel === "very_high") {
      triggerRiskCritical({
        tenantId: ctx.tenantId,
        tenantSlug,
        riskId: risk.id,
        riskCode: code,
        riskTitle: data.title,
        riskLevel,
      });
    }

    return successResponse(risk, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
