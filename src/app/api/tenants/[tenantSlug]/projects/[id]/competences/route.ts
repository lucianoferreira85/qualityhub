export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createCompetenceSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "competence", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;
    if (role) where.role = role;

    const competences = await ctx.db.competence.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(competences);
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
    requirePermission(ctx, "competence", "create");

    const body = await request.json();
    const data = createCompetenceSchema.parse(body);

    const competence = await ctx.db.competence.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        role: data.role,
        requiredCompetence: data.requiredCompetence,
        currentLevel: data.currentLevel || null,
        trainingAction: data.trainingAction || null,
        trainingType: data.trainingType || null,
        evidence: data.evidence || null,
        responsibleId: data.responsibleId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
      },
    });

    return successResponse(competence, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
