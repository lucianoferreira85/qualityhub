export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { createIncidentActionSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; incidentId: string }> }
) {
  try {
    const { tenantSlug, incidentId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityIncident", "read");

    const actions = await ctx.db.incidentAction.findMany({
      where: { incidentId },
      include: {
        responsible: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(actions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; incidentId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, incidentId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityIncident", "create");

    const incident = await ctx.db.securityIncident.findFirst({
      where: { id: incidentId, projectId },
    });
    if (!incident) throw new NotFoundError("Incidente");

    const body = await request.json();
    const data = createIncidentActionSchema.parse(body);

    const action = await ctx.db.incidentAction.create({
      data: {
        tenantId: ctx.tenantId,
        incidentId,
        description: data.description,
        type: data.type,
        responsibleId: data.responsibleId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
      },
    });

    return successResponse(action, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
