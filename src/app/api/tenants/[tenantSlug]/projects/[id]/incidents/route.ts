export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createIncidentSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "securityIncident", "read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const severity = url.searchParams.get("severity");
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;

    const incidents = await ctx.db.securityIncident.findMany({
      where,
      include: {
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(incidents);
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
    requirePermission(ctx, "securityIncident", "create");

    const body = await request.json();
    const data = createIncidentSchema.parse(body);

    const count = await ctx.db.securityIncident.count({ where: { projectId: id } });
    const code = `INC-${String(count + 1).padStart(3, "0")}`;

    const incident = await ctx.db.securityIncident.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        title: data.title,
        description: data.description || null,
        type: data.type,
        severity: data.severity || "medium",
        category: data.category || null,
        detectedAt: new Date(data.detectedAt),
        reportedById: ctx.userId,
        assignedToId: data.assignedToId || null,
        affectedAssets: data.affectedAssets || null,
        affectedSystems: data.affectedSystems || null,
        impactDescription: data.impactDescription || null,
        nonconformityId: data.nonconformityId || null,
        notes: data.notes || null,
      },
    });

    return successResponse(incident, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
