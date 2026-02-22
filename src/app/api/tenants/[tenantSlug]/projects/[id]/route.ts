export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateProjectSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "project", "read");

    const project = await ctx.db.project.findFirst({
      where: { id },
      include: {
        client: true,
        standards: { include: { standard: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        _count: {
          select: {
            risks: true,
            nonconformities: true,
            actionPlans: true,
            audits: true,
            documents: true,
            requirements: true,
            controls: true,
            securityObjectives: true,
            policies: true,
            awarenessCampaigns: true,
            improvementOpportunities: true,
            securityIncidents: true,
            informationAssets: true,
            suppliers: true,
            changeRequests: true,
          },
        },
      },
    });

    if (!project) throw new NotFoundError("Projeto");

    return successResponse(project);
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
    requirePermission(ctx, "project", "update");

    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const updated = await ctx.db.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        archivedAt: data.status === "archived" ? new Date() : undefined,
      },
    });

    return successResponse(updated);
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
    requirePermission(ctx, "project", "delete");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    await ctx.db.project.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
